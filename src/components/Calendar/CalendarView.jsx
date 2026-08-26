import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';

export const CalendarView = () => {
  const { workingDays = {}, setWorkingDays, holidays = [], addHoliday, deleteHoliday } = useProjectStore();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleRegisterHoliday = (e) => {
    e.preventDefault();
    setError('');
    if (!date || !name.trim()) return;
    if (holidays.some((h) => h.date === date)) {
      setError('Ya existe un feriado o excepción registrado en esta fecha.');
      return;
    }
    addHoliday({ date, name: name.trim() });
    setDate('');
    setName('');
  };

  const isMonFri =
    workingDays[1] &&
    workingDays[2] &&
    workingDays[3] &&
    workingDays[4] &&
    workingDays[5] &&
    !workingDays[6] &&
    !workingDays[0];
  const isMonSat =
    workingDays[1] &&
    workingDays[2] &&
    workingDays[3] &&
    workingDays[4] &&
    workingDays[5] &&
    workingDays[6] &&
    !workingDays[0];

  const daysConfig = [
    { key: 1, label: 'Lun' },
    { key: 2, label: 'Mar' },
    { key: 3, label: 'Mié' },
    { key: 4, label: 'Jue' },
    { key: 5, label: 'Vie' },
    { key: 6, label: 'Sáb' },
    { key: 0, label: 'Dom' },
  ];

  const handleToggleDay = (dayKey) => {
    const updated = { ...workingDays, [dayKey]: !workingDays[dayKey] };
    const hasAtLeastOne = Object.values(updated).some(Boolean);
    if (!hasAtLeastOne) {
      alert('Debe haber al menos un día laboral habilitado en la semana.');
      return;
    }
    setWorkingDays(updated);
  };

  return (
    <div className="p-8 h-full overflow-auto bg-[#09090b] custom-scrollbar">
      <div className="max-w-2xl mx-auto bg-[#1e293b] p-8 rounded-xl shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <i className="fa-solid fa-calendar-alt text-emerald-400 mr-3"></i>
          Calendario y Excepciones Laborales
        </h2>
        <p className="text-slate-400 text-xs mb-6">
          Configura los días en que tu proyecto se ejecutará. Las excepciones y feriados empujarán las tareas automáticamente mediante el Motor CPM.
        </p>

        {/* Presets de Jornada Laboral */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() =>
              setWorkingDays({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: false, 0: false })
            }
            className={`flex-1 py-3.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 border ${
              isMonFri
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-briefcase"></i> Jornada Lunes a Viernes
          </button>
          <button
            onClick={() =>
              setWorkingDays({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 0: false })
            }
            className={`flex-1 py-3.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 border ${
              isMonSat
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-helmet-safety"></i> Jornada Lunes a Sábado (Construcción)
          </button>
        </div>

        {/* Selector Individual de Días Laborales */}
        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 mb-8">
          <span className="text-[11px] font-bold text-slate-400 block mb-2">
            Días Laborales Activos en la Semana:
          </span>
          <div className="grid grid-cols-7 gap-2">
            {daysConfig.map((d) => {
              const active = !!workingDays[d.key];
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => handleToggleDay(d.key)}
                  className={`py-2 rounded text-xs font-bold transition-all border ${
                    active
                      ? 'bg-emerald-600/80 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensaje de Error si aplica */}
        {error && (
          <div className="bg-rose-950/60 border border-rose-600 text-rose-300 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Registro de Feriados */}
        <form onSubmit={handleRegisterHoliday} className="flex flex-wrap gap-3 mb-8 border-t border-slate-700 pt-6">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 shadow-inner"
            title="Fecha de la Excepción"
          />
          <input
            type="text"
            required
            placeholder="Motivo de la excepción (Ej. Feriado Nacional)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 shadow-inner min-w-[200px]"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center gap-2"
          >
            <i className="fa-solid fa-calendar-plus"></i> Registrar
          </button>
        </form>

        {/* Lista de Feriados y Días No Laborales Registrados */}
        <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-800 shadow-inner">
          <h3 className="text-slate-400 font-bold text-xs mb-3 border-b border-slate-700/80 pb-2 flex items-center justify-between">
            <span>Días No Laborables Registrados</span>
            <span className="text-slate-500 font-normal">{holidays.length} excepción(es)</span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {holidays.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No hay excepciones configuradas.</p>
            ) : (
              holidays.map((h) => (
                <div
                  key={h.date}
                  className="flex justify-between items-center py-2 px-3 bg-slate-800/80 rounded border border-slate-700/80 shadow-sm text-xs"
                >
                  <span className="text-rose-400 font-bold flex items-center gap-2.5">
                    <i className="fa-regular fa-calendar-xmark text-sm"></i>
                    <span>{h.date}</span>
                    <span className="text-slate-300 font-medium ml-2">{h.name}</span>
                  </span>
                  <button
                    onClick={() => deleteHoliday(h.date)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Eliminar Excepción"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
