import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { formatD } from '../../lib/cpmEngine';

export const GanttTable = ({ tableRef, visibleTasks = [] }) => {
  const {
    resources,
    cpmResult,
    updateTask,
    insertTask,
    deleteTask,
    indentTask,
    outdentTask,
  } = useProjectStore();

  const { collapsed, toggleCollapse, autoLink } = useUIStore();
  const { pSum = {} } = cpmResult;

  const getTaskStatusStyle = (t) => {
    if (t.isP) return { lbl: 'Partida', cl: 'text-amber-300' };
    if (t.manualStatus && t.manualStatus !== 'AUTO') {
      if (t.manualStatus === 'Completada') return { lbl: 'Completada', cl: 'text-emerald-400' };
      if (t.manualStatus === 'Con Retraso') return { lbl: 'Con Retraso', cl: 'text-rose-400', isR: true };
      if (t.manualStatus === 'Pendiente') return { lbl: 'Pendiente', cl: 'text-slate-400' };
      return { lbl: 'En Plazo', cl: 'text-cyan-300' };
    }
    if (t.progress >= 100) return { lbl: 'Completada', cl: 'text-emerald-400' };
    return { lbl: 'En Plazo', cl: 'text-cyan-300' };
  };

  return (
    <div
      ref={tableRef}
      className="overflow-auto flex-1 h-full select-text bg-[#1e293b] custom-scrollbar"
    >
      <table className="gantt-table text-left text-xs mb-10 w-full">
        <colgroup>
          <col style={{ width: '100px' }} />
          <col style={{ width: '280px' }} />
          <col style={{ width: '60px' }} />
          <col style={{ width: '60px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '70px' }} />
          <col style={{ width: '80px' }} />
          <col style={{ width: '70px' }} />
          <col style={{ width: '90px' }} />
        </colgroup>

        <thead className="bg-[#0f172a] sticky top-0 z-30 shadow-md">
          {/* Fila Encabezados de Columna (Limpia y 100% Visible) */}
          <tr className="text-slate-300 font-bold bg-slate-800 h-[56px] text-[10px] border-b border-slate-700">
            <th className="text-center">
              <i className="fa-solid fa-wrench text-blue-400"></i> Edición
            </th>
            <th className="px-2">Descripción de la Partida</th>
            <th className="px-2 text-center">Dur.</th>
            <th className="px-2 text-center">Holg.</th>
            <th className="px-2">Inicio (ES)</th>
            <th className="px-2">Fin (EF)</th>
            <th className="px-1 text-center">Pred.</th>
            <th className="px-1 text-center">Pos.In</th>
            <th className="px-1 text-center">Pos.Fin</th>
            <th className="px-2 text-center">Recurso</th>
            <th className="px-2 text-center">Estado</th>
            <th className="px-2 text-center">% Av</th>
            <th className="px-2 text-right">Costo ($)</th>
          </tr>
        </thead>

        <tbody>
          {/* Fila Resumen Global de Proyecto (Fila 0 de la Tabla) */}
          <tr className="bg-amber-500 text-slate-900 font-bold border-b border-amber-700 h-[32px]">
            <td className="text-center px-1 border-r border-amber-600/50">
              <i className="fa-solid fa-chart-line"></i>
            </td>
            <td className="px-2 border-r border-amber-600/50">
              <i className="fa-solid fa-building mr-1"></i> RESUMEN PROYECTO GLOBAL
            </td>
            <td className="px-2 text-right border-r border-amber-600/50">
              Σ {pSum.dur || 0} d
            </td>
            <td className="px-2 text-center border-r border-amber-600/50">-</td>
            <td className="px-2 border-r border-amber-600/50 text-[10px]">
              {formatD(pSum.start)}
            </td>
            <td className="px-2 border-r border-amber-600/50 text-[10px]">
              {formatD(pSum.end)}
            </td>
            <td colSpan="5" className="px-2 text-center border-r border-amber-600/50 font-black">
              Global
            </td>
            <td className="px-2 text-center border-r border-amber-600/50 font-black">
              Σ {(pSum.prog || 0).toFixed(0)}%
            </td>
            <td className="px-2 text-right border-r border-amber-600/50 font-black">
              Σ ${(pSum.cost || 0).toLocaleString()}
            </td>
          </tr>
          {visibleTasks.map((t) => {
            const isMilestone = t.duration === 0 && !t.isP;
            const statusStyle = getTaskStatusStyle(t);
            const isCollapsed = collapsed.includes(t.id);

            return (
              <tr
                key={t.id}
                className={`hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 ${
                  t.isP ? 'bg-amber-900/10 font-bold text-amber-100' : 'text-slate-300'
                } ${statusStyle.isR ? 'bg-rose-950/20' : ''}`}
              >
                {/* 1. Botones de Edición */}
                <td className="text-center px-1">
                  <div className="flex justify-center items-center gap-1.5 text-slate-500">
                    <button
                      onClick={() => insertTask(t.id, 'S', autoLink)}
                      title="Insertar Hermano Abajo"
                      className="hover:text-amber-400 transition-colors"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                    </button>
                    <button
                      onClick={() => insertTask(t.id, 'C', autoLink)}
                      title="Insertar Subpartida / Tarea Hija"
                      className="hover:text-emerald-400 transition-colors"
                    >
                      <i className="fa-solid fa-file-import text-[10px]"></i>
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      title="Eliminar Partida"
                      className="hover:text-rose-400 transition-colors"
                    >
                      <i className="fa-solid fa-trash text-[10px]"></i>
                    </button>
                    <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
                    <button
                      onClick={() => outdentTask(t.id)}
                      title="Disminuir Nivel (Outdent)"
                      className="hover:text-blue-400 transition-colors"
                    >
                      <i className="fa-solid fa-outdent text-[10px]"></i>
                    </button>
                    <button
                      onClick={() => indentTask(t.id)}
                      title="Aumentar Nivel (Indent)"
                      className="hover:text-blue-400 transition-colors"
                    >
                      <i className="fa-solid fa-indent text-[10px]"></i>
                    </button>
                  </div>
                </td>

                {/* 2. Descripción con Indentación */}
                <td style={{ paddingLeft: `${(t.level - 1) * 14 + 6}px` }}>
                  <div className="flex items-center gap-1.5">
                    {t.isP ? (
                      <button
                        onClick={() => toggleCollapse(t.id)}
                        className="text-amber-500 w-3 text-center"
                      >
                        <i className={`fa-solid ${isCollapsed ? 'fa-caret-right' : 'fa-caret-down'}`}></i>
                      </button>
                    ) : isMilestone ? (
                      <i className="fa-solid fa-square rotate-45 text-slate-500 text-[8px] w-3 text-center"></i>
                    ) : (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mx-auto shrink-0 ${
                          t.crit ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-blue-500'
                        }`}
                      ></span>
                    )}

                    {t.isP && <i className="fa-regular fa-folder text-amber-500/70 text-[10px]"></i>}

                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => updateTask(t.id, 'name', e.target.value)}
                      className="table-input w-full"
                    />
                  </div>
                </td>

                {/* 3. Duración */}
                <td className="text-right">
                  {t.isP ? (
                    <span className="text-amber-300 pr-2">Σ {t.duration} d</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={t.duration}
                      onChange={(e) => updateTask(t.id, 'duration', e.target.value)}
                      className="table-input text-right pr-2 w-full"
                    />
                  )}
                </td>

                {/* 4. Holgura Total */}
                <td className="text-center">
                  {t.isP ? (
                    <span className="opacity-50">-</span>
                  ) : (
                    <span className={`font-bold ${t.crit ? 'text-rose-400' : 'text-slate-400'}`}>
                      {t.TF} d
                    </span>
                  )}
                </td>

                {/* 5. Inicio (ES) */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block px-1 opacity-90">{formatD(t.ES)}</span>
                  ) : (
                    <input
                      type="date"
                      value={t.manualStart || t.ES || ''}
                      onChange={(e) => updateTask(t.id, 'manualStart', e.target.value)}
                      className="table-input cursor-pointer text-xs w-full"
                    />
                  )}
                </td>

                {/* 6. Fin (EF) */}
                <td className="px-1">
                  <span className="block px-1 opacity-80">{formatD(t.EF)}</span>
                </td>

                {/* 7. Predecesoras */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-center opacity-50">-</span>
                  ) : (
                    <input
                      type="text"
                      value={t.predecessors}
                      onChange={(e) => updateTask(t.id, 'predecessors', e.target.value)}
                      className="table-input text-center w-full"
                    />
                  )}
                </td>

                {/* 8. Demora Inicio (Pos.In) */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-center opacity-50">-</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={t.startDelay || 0}
                      onChange={(e) => updateTask(t.id, 'startDelay', e.target.value)}
                      className="table-input text-center w-full"
                    />
                  )}
                </td>

                {/* 9. Demora Fin (Pos.Fin) */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-center opacity-50">-</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={t.finishDelay || 0}
                      onChange={(e) => updateTask(t.id, 'finishDelay', e.target.value)}
                      className="table-input text-center w-full"
                    />
                  )}
                </td>

                {/* 10. Recurso */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-center opacity-50">-</span>
                  ) : (
                    <select
                      value={t.resourceId || ''}
                      onChange={(e) => updateTask(t.id, 'resourceId', parseInt(e.target.value) || '')}
                      className="table-input text-center text-blue-400 font-bold appearance-none w-full cursor-pointer"
                    >
                      <option value="" className="bg-slate-800">
                        N/A
                      </option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id} className="bg-slate-800 text-white">
                          {r.initials}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                {/* 11. Estado */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-center opacity-50">-</span>
                  ) : (
                    <select
                      value={t.manualStatus || 'AUTO'}
                      onChange={(e) => updateTask(t.id, 'manualStatus', e.target.value)}
                      className={`table-input text-center text-[9px] w-full appearance-none font-bold cursor-pointer ${statusStyle.cl}`}
                    >
                      <option value="AUTO" className="bg-slate-800 text-slate-300">
                        Auto
                      </option>
                      <option value="Completada" className="bg-slate-800 text-emerald-400">
                        Completada
                      </option>
                      <option value="En Plazo" className="bg-slate-800 text-cyan-300">
                        En Plazo
                      </option>
                      <option value="Con Retraso" className="bg-slate-800 text-rose-400">
                        Con Retraso
                      </option>
                    </select>
                  )}
                </td>

                {/* 12. % Avance */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-center font-bold text-amber-300">
                      Σ {t.progress.toFixed(0)}%
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={t.progress}
                      onChange={(e) => updateTask(t.id, 'progress', e.target.value)}
                      className="table-input text-center text-emerald-400 font-bold w-full"
                    />
                  )}
                </td>

                {/* 13. Costo ($ CLP) */}
                <td className="px-1">
                  {t.isP ? (
                    <span className="block text-right pr-1 font-bold text-amber-300">
                      ${(t.cost || 0).toLocaleString()}
                    </span>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-slate-500 text-[10px] mr-0.5">$</span>
                      <input
                        type="number"
                        min="0"
                        value={t.cost || 0}
                        onChange={(e) => updateTask(t.id, 'cost', e.target.value)}
                        className="table-input text-right w-full font-medium"
                      />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
