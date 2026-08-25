import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export const DashboardView = () => {
  const { cpmResult } = useProjectStore();
  const { hoverDonut, setHoverDonut } = useUIStore();

  const { pSum = {}, evm = {}, dashData = {} } = cpmResult;

  return (
    <div id="dashboard-container" className="p-8 h-full overflow-auto bg-[#09090b] custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Título de Sección */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-extrabold text-white flex items-center">
            <i className="fa-solid fa-chart-line text-blue-500 mr-3"></i>
            Dashboard Ejecutivo Multi-Industria
          </h2>
        </div>

        {/* 1. Tarjetas de KPIs PMBOK / EVM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Duración EAC */}
          <div className="bg-[#1e293b] border border-slate-700 p-5 rounded-lg shadow-md border-l-4 border-l-blue-500">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duración (EAC)</p>
            <p className="text-3xl font-black text-white mt-1">
              {pSum.dur || 0} <span className="text-xs font-semibold text-slate-500">días</span>
            </p>
          </div>

          {/* Presupuesto BAC */}
          <div className="bg-[#1e293b] border border-slate-700 p-5 rounded-lg shadow-md border-l-4 border-l-amber-500">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presupuesto (BAC)</p>
            <p className="text-3xl font-black text-amber-400 mt-1">
              ${(pSum.cost || 0).toLocaleString()}
            </p>
          </div>

          {/* Progreso Físico */}
          <div className="bg-[#1e293b] border border-slate-700 p-5 rounded-lg shadow-md border-l-4 border-l-emerald-500">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Progreso Físico</p>
            <p className="text-3xl font-black text-white mt-1">
              {(pSum.prog || 0).toFixed(1)}%
            </p>
          </div>

          {/* SPI (Schedule Performance Index) */}
          <div
            className={`border p-5 rounded-lg shadow-md border-l-4 ${
              (evm.spi || 1) >= 1
                ? 'bg-[#1e293b] border-slate-700 border-l-emerald-500'
                : 'bg-rose-950/20 border-rose-900 border-l-rose-500'
            }`}
          >
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Desempeño Crono (SPI)</p>
            <p
              className={`text-3xl font-black mt-1 ${
                (evm.spi || 1) >= 1 ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              {(evm.spi || 1).toFixed(2)}
            </p>
          </div>

          {/* SV (Schedule Variance) */}
          <div
            className={`border p-5 rounded-lg shadow-md border-l-4 ${
              (evm.sv || 0) >= 0
                ? 'bg-[#1e293b] border-slate-700 border-l-emerald-500'
                : 'bg-rose-950/20 border-rose-900 border-l-rose-500'
            }`}
          >
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Varianza Crono (SV)</p>
            <p
              className={`text-2xl font-black mt-2 ${
                (evm.sv || 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              ${Math.round(evm.sv || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 2. Gráficos: Donut Chart de Estado + Distribución de Costos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico Donut de Estado de Partidas */}
          <div className="bg-[#1e293b] border border-slate-700 p-6 rounded-lg shadow flex flex-col items-center">
            <h3 className="font-bold text-white self-start w-full border-b border-slate-700 pb-3 mb-6 flex items-center">
              <i className="fa-solid fa-chart-pie text-cyan-400 mr-2"></i>
              Estado de Partidas (Kanban/Gantt)
            </h3>
            <div className="flex flex-col sm:flex-row w-full items-center justify-center gap-8 my-auto">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0f172a" strokeWidth="15" />
                  {/* Completadas */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={hoverDonut === 'CP' ? 20 : 15}
                    strokeDasharray={`${((dashData.cp || 0) / (dashData.tot || 1)) * 251} 251`}
                    onMouseEnter={() => setHoverDonut('CP')}
                    onMouseLeave={() => setHoverDonut(null)}
                    className="cursor-pointer transition-all"
                  />
                  {/* En Plazo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth={hoverDonut === 'PL' ? 20 : 15}
                    strokeDasharray={`${((dashData.pl || 0) / (dashData.tot || 1)) * 251} 251`}
                    strokeDashoffset={-(((dashData.cp || 0) / (dashData.tot || 1)) * 251)}
                    onMouseEnter={() => setHoverDonut('PL')}
                    onMouseLeave={() => setHoverDonut(null)}
                    className="cursor-pointer transition-all"
                  />
                  {/* Con Retraso */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth={hoverDonut === 'AT' ? 20 : 15}
                    strokeDasharray={`${((dashData.at || 0) / (dashData.tot || 1)) * 251} 251`}
                    strokeDashoffset={-((((dashData.cp || 0) + (dashData.pl || 0)) / (dashData.tot || 1)) * 251)}
                    onMouseEnter={() => setHoverDonut('AT')}
                    onMouseLeave={() => setHoverDonut(null)}
                    className="cursor-pointer transition-all"
                  />
                </svg>

                {/* Contador Central del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {hoverDonut === 'CP' ? (
                    <>
                      <span className="text-3xl font-black text-emerald-400">{dashData.cp || 0}</span>
                      <span className="text-[9px] text-emerald-500 font-bold uppercase">Completadas</span>
                    </>
                  ) : hoverDonut === 'PL' ? (
                    <>
                      <span className="text-3xl font-black text-sky-400">{dashData.pl || 0}</span>
                      <span className="text-[9px] text-sky-500 font-bold uppercase">En Plazo</span>
                    </>
                  ) : hoverDonut === 'AT' ? (
                    <>
                      <span className="text-3xl font-black text-rose-500">{dashData.at || 0}</span>
                      <span className="text-[9px] text-rose-600 font-bold uppercase">Con Retraso</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white">{dashData.tot || 0}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Totales</span>
                    </>
                  )}
                </div>
              </div>

              {/* Leyenda interactiva */}
              <div className="flex flex-col gap-4">
                <div
                  className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-800 transition"
                  onMouseEnter={() => setHoverDonut('CP')}
                  onMouseLeave={() => setHoverDonut(null)}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded ${
                      hoverDonut === 'CP' ? 'bg-emerald-400 scale-125' : 'bg-emerald-500'
                    } transition-all`}
                  ></div>
                  <div>
                    <p className={`font-bold text-base leading-none ${hoverDonut === 'CP' ? 'text-emerald-400' : 'text-white'}`}>
                      {dashData.cp || 0}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">COMPLETADAS</p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-800 transition"
                  onMouseEnter={() => setHoverDonut('PL')}
                  onMouseLeave={() => setHoverDonut(null)}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded ${
                      hoverDonut === 'PL' ? 'bg-sky-400 scale-125' : 'bg-sky-500'
                    } transition-all`}
                  ></div>
                  <div>
                    <p className={`font-bold text-base leading-none ${hoverDonut === 'PL' ? 'text-sky-400' : 'text-white'}`}>
                      {dashData.pl || 0}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">EN PLAZO</p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-800 transition"
                  onMouseEnter={() => setHoverDonut('AT')}
                  onMouseLeave={() => setHoverDonut(null)}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded ${
                      hoverDonut === 'AT' ? 'bg-rose-400 scale-125' : 'bg-rose-500'
                    } transition-all`}
                  ></div>
                  <div>
                    <p className={`font-bold text-base leading-none ${hoverDonut === 'AT' ? 'text-rose-400' : 'text-white'}`}>
                      {dashData.at || 0}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">CON RETRASO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribución de Presupuesto */}
          <div className="bg-[#1e293b] border border-slate-700 p-6 rounded-lg shadow">
            <h3 className="font-bold text-white w-full border-b border-slate-700 pb-3 mb-6 flex items-center">
              <i className="fa-solid fa-money-bill text-amber-400 mr-2"></i>
              Distribución de Presupuesto (Costos)
            </h3>
            <div className="space-y-6">
              {/* Mano de Obra */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-blue-400">Mano de Obra / Devs</span>
                  <span className="text-white">${(dashData.mo || 0).toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${pSum.cost > 0 ? ((dashData.mo || 0) / pSum.cost) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Materiales */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-amber-400">Materiales / Hardware</span>
                  <span className="text-white">${(dashData.mat || 0).toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width: `${pSum.cost > 0 ? ((dashData.mat || 0) / pSum.cost) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Equipos / Otros */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-emerald-400">Equipos / Infraestructura / Otros</span>
                  <span className="text-white">${(dashData.eq || 0).toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${pSum.cost > 0 ? ((dashData.eq || 0) / pSum.cost) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
