import React, { useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export const ResourcesView = () => {
  const { resources, addResource, updateResource, deleteResource } = useProjectStore();
  const { resFilters, setResFilters } = useUIStore();

  const visibleResources = useMemo(() => {
    return resources.filter((r) => {
      if (resFilters.name && !r.name.toLowerCase().includes(resFilters.name.toLowerCase())) {
        return false;
      }
      if (resFilters.type !== 'ALL' && r.type !== resFilters.type) return false;
      if (resFilters.group !== 'ALL' && r.group !== resFilters.group) return false;
      if (resFilters.accrual !== 'ALL' && r.accrual !== resFilters.accrual) return false;
      return true;
    });
  }, [resources, resFilters]);

  return (
    <div className="p-8 h-full overflow-auto bg-[#09090b] custom-scrollbar">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Cabecera de Sección */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <i className="fa-solid fa-users text-blue-400 mr-3"></i>
            Pool de Recursos
          </h2>
          <button
            onClick={addResource}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold shadow-lg transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Añadir Recurso
          </button>
        </div>

        {/* Barra de Filtros Avanzada */}
        <div className="bg-slate-800 p-4 rounded-t-lg border border-slate-700 flex flex-wrap items-center justify-between shadow-sm gap-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <i className="fa-solid fa-filter"></i> Filtros
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                placeholder="Buscar por Nombre..."
                value={resFilters.name}
                onChange={(e) => setResFilters({ ...resFilters, name: e.target.value })}
                className="bg-slate-900 border border-slate-600 rounded pl-8 pr-3 py-1.5 text-xs text-white outline-none w-56 focus:border-blue-500 shadow-inner"
              />
            </div>
            <select
              value={resFilters.type}
              onChange={(e) => setResFilters({ ...resFilters, type: e.target.value })}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs text-slate-300 outline-none w-40 cursor-pointer shadow-inner focus:border-blue-500"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="Trabajo">Trabajo</option>
              <option value="Material">Material</option>
              <option value="Costo">Costo</option>
            </select>
            <select
              value={resFilters.group}
              onChange={(e) => setResFilters({ ...resFilters, group: e.target.value })}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs text-slate-300 outline-none w-48 cursor-pointer shadow-inner focus:border-blue-500"
            >
              <option value="ALL">Todos los Grupos</option>
              <option value="Mano de Obra">Mano de Obra</option>
              <option value="Equipos">Equipos</option>
              <option value="Materiales">Materiales</option>
              <option value="Infraestructura">Infraestructura</option>
            </select>
            <select
              value={resFilters.accrual}
              onChange={(e) => setResFilters({ ...resFilters, accrual: e.target.value })}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs text-slate-300 outline-none w-40 cursor-pointer shadow-inner focus:border-blue-500"
            >
              <option value="ALL">Acumulación: Todas</option>
              <option value="Prorrateo">Prorrateo</option>
              <option value="Inicio">Inicio</option>
              <option value="Fin">Fin</option>
            </select>
            <button
              onClick={() => setResFilters({ name: '', type: 'ALL', group: 'ALL', accrual: 'ALL' })}
              className="bg-rose-900/40 text-rose-300 border border-rose-700 hover:bg-rose-800 px-3 rounded text-xs ml-auto transition-colors flex items-center gap-1.5"
            >
              <i className="fa-solid fa-times"></i> Limpiar
            </button>
          </div>
        </div>

        {/* Tabla de Recursos (10 Columnas) */}
        <div className="bg-[#1e293b] rounded-b-lg border-x border-b border-slate-700 overflow-x-auto shadow-lg">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-[#0f172a] text-slate-300 border-b border-slate-700 font-bold">
              <tr>
                <th className="p-3 w-10 text-center">
                  <i className="fa-solid fa-cog"></i>
                </th>
                <th className="p-3">Descripción del Recurso</th>
                <th className="p-3 w-28">Tipo</th>
                <th className="p-3 w-24">U.M.</th>
                <th className="p-3 w-20 text-center">Iniciales</th>
                <th className="p-3 w-36">Grupo</th>
                <th className="p-3 w-28 text-center">Capacidad Máx(%)</th>
                <th className="p-3 w-32 text-right">Tarifa Est. ($/UM)</th>
                <th className="p-3 w-32 text-right">Costo x Uso ($)</th>
                <th className="p-3 w-32">Acumulación</th>
              </tr>
            </thead>
            <tbody>
              {visibleResources.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-500 italic font-medium">
                    No se encontraron recursos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                visibleResources.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-700/50 hover:bg-slate-800/80 transition-colors h-12"
                  >
                    <td className="p-2 text-center">
                      <button
                        onClick={() => deleteResource(r.id)}
                        className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                        title="Eliminar Recurso"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => updateResource(r.id, 'name', e.target.value)}
                        className="table-input font-bold text-white h-8"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={r.type}
                        onChange={(e) => updateResource(r.id, 'type', e.target.value)}
                        className="table-input text-slate-300 cursor-pointer appearance-none h-8"
                      >
                        <option className="bg-slate-800">Trabajo</option>
                        <option className="bg-slate-800">Material</option>
                        <option className="bg-slate-800">Costo</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={r.unit}
                        onChange={(e) => updateResource(r.id, 'unit', e.target.value)}
                        className="table-input text-slate-300 h-8"
                        placeholder="Ej: Hrs, m3..."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={r.initials}
                        onChange={(e) => updateResource(r.id, 'initials', e.target.value)}
                        className="table-input text-center text-blue-400 font-black uppercase tracking-wider h-8"
                        maxLength="4"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={r.group}
                        onChange={(e) => updateResource(r.id, 'group', e.target.value)}
                        className="table-input text-slate-300 h-8"
                        placeholder="Ej: Devs"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center items-center">
                        <input
                          type="number"
                          min="0"
                          value={r.capacity}
                          onChange={(e) => updateResource(r.id, 'capacity', e.target.value)}
                          className="table-input text-center text-emerald-400 font-bold h-8 w-16"
                        />
                        <span className="text-slate-500 ml-1">%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-500 mr-1">$</span>
                        <input
                          type="number"
                          min="0"
                          value={r.rate}
                          onChange={(e) => updateResource(r.id, 'rate', e.target.value)}
                          className="table-input text-right text-emerald-400 font-bold h-8 w-24"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-500 mr-1">$</span>
                        <input
                          type="number"
                          min="0"
                          value={r.costPerUse}
                          onChange={(e) => updateResource(r.id, 'costPerUse', e.target.value)}
                          className="table-input text-right text-amber-400 font-bold h-8 w-24"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <select
                        value={r.accrual}
                        onChange={(e) => updateResource(r.id, 'accrual', e.target.value)}
                        className="table-input text-slate-300 cursor-pointer appearance-none h-8"
                      >
                        <option className="bg-slate-800">Prorrateo</option>
                        <option className="bg-slate-800">Inicio</option>
                        <option className="bg-slate-800">Fin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
