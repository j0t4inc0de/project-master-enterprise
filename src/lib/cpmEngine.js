/**
 * Motor de Cálculo CPM (Critical Path Method), EVM (Earned Value Management) y Curva S
 * Optimizado para alto rendimiento (60 FPS) y prevención de dependencias circulares.
 */

export const formatD = (dStr) => {
  if (!dStr || dStr === '-') return '-';
  const p = dStr.split('-');
  if (p.length !== 3) return '-';
  return `${p[2]}-${p[1]}-${p[0].substring(2)}`;
};

export const toDateKey = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const toHolidaySet = (holidays) => {
  if (holidays instanceof Set) return holidays;
  const set = new Set();
  if (Array.isArray(holidays)) {
    for (let i = 0; i < holidays.length; i++) {
      const h = holidays[i];
      if (typeof h === 'string') set.add(h);
      else if (h && h.date) set.add(h.date);
    }
  }
  return set;
};

export const isWorkDay = (d, workingDays = {}, holidays = []) => {
  if (!d || isNaN(d.getTime())) return false;
  const wDays = workingDays || {};
  if (!wDays[d.getDay()]) return false;
  const hSet = holidays instanceof Set ? holidays : toHolidaySet(holidays);
  return !hSet.has(toDateKey(d));
};

export const addWorkDays = (sStr, days, workingDays = {}, holidays = []) => {
  if (!sStr) return sStr;
  const d = new Date(sStr + 'T00:00:00');
  if (isNaN(d.getTime())) return sStr;

  const wDays = workingDays || {};
  const hasAnyWorkingDay = Object.values(wDays).some(Boolean);
  const rem = parseInt(days) || 0;

  if (!hasAnyWorkingDay) {
    d.setDate(d.getDate() + rem);
    return toDateKey(d);
  }

  const hSet = holidays instanceof Set ? holidays : toHolidaySet(holidays);
  let safetyCounter = 0;
  const maxSafetyDays = 10000;

  if (rem === 0) {
    while (!isWorkDay(d, wDays, hSet) && safetyCounter < maxSafetyDays) {
      d.setDate(d.getDate() + 1);
      safetyCounter++;
    }
    return toDateKey(d);
  }

  if (rem > 0) {
    let c = 0;
    while (c < rem && safetyCounter < maxSafetyDays) {
      d.setDate(d.getDate() + 1);
      if (isWorkDay(d, wDays, hSet)) c++;
      safetyCounter++;
    }
  } else {
    let c = 0;
    while (c < Math.abs(rem) && safetyCounter < maxSafetyDays) {
      d.setDate(d.getDate() - 1);
      if (isWorkDay(d, wDays, hSet)) c++;
      safetyCounter++;
    }
  }
  return toDateKey(d);
};

export const getWorkDays = (sStr, eStr, workingDays = {}, holidays = []) => {
  if (!sStr || !eStr) return 0;
  const s = new Date(sStr + 'T00:00:00');
  const e = new Date(eStr + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;

  const wDays = workingDays || {};
  const hSet = holidays instanceof Set ? holidays : toHolidaySet(holidays);
  let c = 0;
  const t = new Date(s);
  let safetyCounter = 0;
  const maxSafetyDays = 50000;

  while (t <= e && safetyCounter < maxSafetyDays) {
    if (isWorkDay(t, wDays, hSet)) c++;
    t.setDate(t.getDate() + 1);
    safetyCounter++;
  }
  return c;
};

/**
 * Parser de predecesoras con soporte para IDs simples y lags inline (ej. "1", "1+2", "1-2", "1FS+2")
 */
export const parsePredecessor = (predStr) => {
  const str = String(predStr || '').trim();
  const match = str.match(/^(\d+)(?:([A-Za-z]+)?([+-]\d+))?/);
  if (!match) return { id: parseInt(str), lag: 0 };
  const id = parseInt(match[1]);
  const lag = match[3] ? parseInt(match[3]) : 0;
  return { id, lag };
};

/**
 * Detecta si existen ciclos en las dependencias de las tareas (DFS)
 */
export const detectCycles = (tasks) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return false;
  const adj = new Map();
  tasks.forEach((t) => {
    if (t.predecessors) {
      const preds = String(t.predecessors)
        .split(',')
        .map((p) => parsePredecessor(p).id)
        .filter((id) => !isNaN(id));
      adj.set(t.id, preds);
    } else {
      adj.set(t.id, []);
    }
  });

  const visited = new Set();
  const recStack = new Set();

  function hasCycleDFS(node) {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    if (!visited.has(t.id)) {
      if (hasCycleDFS(t.id)) return true;
    }
  }

  return false;
};

/**
 * Función principal que calcula el estado completo del proyecto
 * CPM, holguras, ruta crítica, EVM, Curva S y Nodos PERT
 */
export const computeProjectCPM = ({
  tasks = [],
  resources = [],
  holidays = [],
  startDate = '2026-06-01',
  statusDate = '2026-06-15',
  workingDays = {},
  autoProgress = false,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeResources = Array.isArray(resources) ? resources : [];
  const safeHolidays = Array.isArray(holidays) ? holidays : [];
  const wDays = workingDays || {};
  const hasAnyWorkDay = Object.values(wDays).some(Boolean);

  const hasCycle = detectCycles(safeTasks);
  const hSet = toHolidaySet(safeHolidays);

  // 1. Clonar tareas y marcar fases padre (isP)
  const cmp = safeTasks.map((t, i) => ({
    ...t,
    isP: i < safeTasks.length - 1 && safeTasks[i + 1].level > t.level,
    ES: '',
    EF: '',
    LS: '',
    LF: '',
    TF: 0,
    crit: false,
  }));

  if (cmp.length === 0) {
    return {
      tasks: [],
      end: startDate,
      pSum: { dur: 0, start: '-', end: '-', cost: 0, prog: 0 },
      evm: { pv: 0, ev: 0, spi: 1, sv: 0 },
      scurveData: [],
      netNodes: { nds: [], w: 800, h: 600 },
      dashData: { cp: 0, at: 0, pl: 0, tot: 0, mo: 0, mat: 0, eq: 0 },
      hasCycle,
    };
  }

  // Mapa rápido de tareas por ID para O(1) lookups
  const taskMap = new Map(cmp.map((t) => [t.id, t]));

  // 2. Forward Pass: Calcular Early Start (ES) y Early Finish (EF)
  let chg = true;
  let iter = 0;
  const maxIter = hasCycle ? 5 : 50;

  while (chg && iter < maxIter) {
    chg = false;
    iter++;
    let pES = [];

    for (let i = 0; i < cmp.length; i++) {
      const t = cmp[i];
      let tES = startDate;

      if (t.manualStart) {
        const d = new Date(t.manualStart + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          let sCount = 0;
          while (hasAnyWorkDay && !isWorkDay(d, wDays, hSet) && sCount < 1000) {
            d.setDate(d.getDate() + 1);
            sCount++;
          }
          tES = toDateKey(d);
        }
      } else if (t.predecessors) {
        let mx = 0;
        let mxD = null;
        const predIds = String(t.predecessors).split(',');
        for (let pIdx = 0; pIdx < predIds.length; pIdx++) {
          const { id: prId, lag: predLag } = parsePredecessor(predIds[pIdx]);
          const pr = taskMap.get(prId);
          if (pr && pr.EF) {
            const nd = new Date(pr.EF + 'T00:00:00');
            if (!isNaN(nd.getTime())) {
              if ((parseInt(pr.duration) || 0) > 0) nd.setDate(nd.getDate() + 1);
              let sCount = 0;
              while (hasAnyWorkDay && !isWorkDay(nd, wDays, hSet) && sCount < 1000) {
                nd.setDate(nd.getDate() + 1);
                sCount++;
              }

              const fDelay = (parseInt(t.finishDelay) || 0) + (parseInt(pr.finishDelay) || 0) + predLag;
              if (fDelay > 0) {
                let c = 0;
                let sCount2 = 0;
                while (c < fDelay && sCount2 < 1000) {
                  nd.setDate(nd.getDate() + 1);
                  if (!hasAnyWorkDay || isWorkDay(nd, wDays, hSet)) c++;
                  sCount2++;
                }
              } else if (fDelay < 0) {
                let c = 0;
                let sCount2 = 0;
                while (c < Math.abs(fDelay) && sCount2 < 1000) {
                  nd.setDate(nd.getDate() - 1);
                  if (!hasAnyWorkDay || isWorkDay(nd, wDays, hSet)) c++;
                  sCount2++;
                }
              }
              let sCount3 = 0;
              while (hasAnyWorkDay && !isWorkDay(nd, wDays, hSet) && sCount3 < 1000) {
                nd.setDate(nd.getDate() + (fDelay < 0 ? -1 : 1));
                sCount3++;
              }
              const ndTime = nd.getTime();
              if (ndTime > mx) {
                mx = ndTime;
                mxD = toDateKey(nd);
              }
            }
          }
        }
        if (mxD) tES = mxD;
      }

      const sDelay = parseInt(t.startDelay) || 0;
      if (sDelay !== 0 && !t.manualStart) {
        const nd = new Date(tES + 'T00:00:00');
        if (!isNaN(nd.getTime())) {
          if (sDelay > 0) {
            let c = 0;
            let sCount = 0;
            while (c < sDelay && sCount < 1000) {
              nd.setDate(nd.getDate() + 1);
              if (!hasAnyWorkDay || isWorkDay(nd, wDays, hSet)) c++;
              sCount++;
            }
          } else if (sDelay < 0) {
            let c = 0;
            let sCount = 0;
            while (c < Math.abs(sDelay) && sCount < 1000) {
              nd.setDate(nd.getDate() - 1);
              if (!hasAnyWorkDay || isWorkDay(nd, wDays, hSet)) c++;
              sCount++;
            }
          }
          let sCount2 = 0;
          while (hasAnyWorkDay && !isWorkDay(nd, wDays, hSet) && sCount2 < 1000) {
            nd.setDate(nd.getDate() + (sDelay < 0 ? -1 : 1));
            sCount2++;
          }
          tES = toDateKey(nd);
        }
      } else {
        const d = new Date(tES + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          let sCount = 0;
          while (hasAnyWorkDay && !isWorkDay(d, wDays, hSet) && sCount < 1000) {
            d.setDate(d.getDate() + 1);
            sCount++;
          }
          tES = toDateKey(d);
        }
      }

      pES = pES.slice(0, t.level);
      const pCon = t.level > 1 && pES[t.level - 1] ? pES[t.level - 1] : startDate;
      if (!t.manualStart && new Date(pCon + 'T00:00:00') > new Date(tES + 'T00:00:00')) {
        tES = pCon;
      }

      if (t.isP) {
        pES[t.level] = tES;
      } else {
        const dur = parseInt(t.duration) || 0;
        const ef = addWorkDays(tES, Math.max(0, dur - 1), wDays, hSet);
        if (t.ES !== tES || t.EF !== ef) {
          t.ES = tES;
          t.EF = ef;
          chg = true;
        }
      }
    }
  }

  // 3. Costos avanzados y auto-progreso
  const resourceMap = new Map();
  safeResources.forEach((r) => {
    resourceMap.set(r.id, r);
    resourceMap.set(String(r.id), r);
    if (!isNaN(parseInt(r.id))) resourceMap.set(parseInt(r.id), r);
  });

  for (let i = 0; i < cmp.length; i++) {
    const t = cmp[i];
    if (!t.isP) {
      if (t.resourceId !== '' && t.resourceId !== null && t.resourceId !== undefined) {
        const res =
          resourceMap.get(t.resourceId) ??
          resourceMap.get(String(t.resourceId)) ??
          resourceMap.get(Number(t.resourceId));
        if (res) {
          const dur = parseInt(t.duration) || 0;
          const rateCost = dur * (res.type === 'Trabajo' ? 8 : 1) * (Number(res.rate) || 0);
          const usageCost = Number(res.costPerUse) || 0;
          t.cost = rateCost + (dur >= 0 ? usageCost : 0);
        }
      }

      if (autoProgress && t.ES && !t.manualProgress) {
        const cutT = new Date(statusDate + 'T00:00:00').getTime();
        const sT = new Date(t.ES + 'T00:00:00').getTime();
        const eT = t.EF ? new Date(t.EF + 'T00:00:00').getTime() : sT;
        if (!isNaN(cutT) && !isNaN(sT)) {
          const totalDur = parseInt(t.duration) || 0;
          if (totalDur === 0) {
            t.progress = cutT >= sT ? 100 : 0;
          } else if (cutT >= eT) {
            t.progress = 100;
          } else if (cutT < sT) {
            t.progress = 0;
          } else {
            const workedDays = getWorkDays(t.ES, statusDate, wDays, hSet);
            t.progress = Math.min(100, Math.max(0, Math.round((workedDays / totalDur) * 100)));
          }
        }
      }
    }
  }

  // 4. Rollup de Fases Padre
  for (let i = cmp.length - 1; i >= 0; i--) {
    if (cmp[i].isP) {
      const desc = [];
      for (let j = i + 1; j < cmp.length; j++) {
        if (cmp[j].level <= cmp[i].level) break;
        desc.push(cmp[j]);
      }
      const lDesc = desc.filter((d) => !d.isP && d.ES && d.EF);
      if (lDesc.length > 0) {
        const vES = lDesc.map((c) => new Date(c.ES + 'T00:00:00').getTime()).filter((v) => !isNaN(v));
        const vEF = lDesc.map((c) => new Date(c.EF + 'T00:00:00').getTime()).filter((v) => !isNaN(v));
        cmp[i].ES = vES.length > 0 ? toDateKey(new Date(Math.min(...vES))) : lDesc[0].ES;
        cmp[i].EF = vEF.length > 0 ? toDateKey(new Date(Math.max(...vEF))) : lDesc[0].EF;
        cmp[i].cost = lDesc.reduce((s, c) => s + (Number(c.cost) || 0), 0);
        const cp = lDesc.reduce((s, c) => s + (Number(c.cost) || 0) * ((Number(c.progress) || 0) / 100), 0);
        cmp[i].progress =
          cmp[i].cost > 0
            ? (cp / cmp[i].cost) * 100
            : lDesc.reduce((s, c) => s + (Number(c.progress) || 0), 0) / (lDesc.length || 1);
        cmp[i].duration = getWorkDays(cmp[i].ES, cmp[i].EF, wDays, hSet);
        if (cmp[i].ES === cmp[i].EF && lDesc.every((x) => parseInt(x.duration) === 0)) cmp[i].duration = 0;
      }
    }
  }

  // 5. Fecha fin global del proyecto (EAC)
  const valEnd = cmp
    .filter((x) => x.EF && !x.isP)
    .map((x) => new Date(x.EF + 'T00:00:00').getTime())
    .filter((x) => !isNaN(x));
  const pEnd = valEnd.length > 0 ? toDateKey(new Date(Math.max(...valEnd))) : startDate;

  // 6. Backward Pass: Pre-computar mapa de sucesores O(1) con lags
  const successorsMap = new Map();
  for (let i = 0; i < cmp.length; i++) {
    const task = cmp[i];
    if (!task.isP && task.predecessors) {
      const preds = String(task.predecessors).split(',');
      for (let p = 0; p < preds.length; p++) {
        const { id: predId, lag: predLag } = parsePredecessor(preds[p]);
        if (!isNaN(predId)) {
          if (!successorsMap.has(predId)) successorsMap.set(predId, []);
          successorsMap.get(predId).push({ task, lag: predLag });
        }
      }
    }
  }

  cmp.forEach((t) => {
    t.LF = pEnd;
  });
  chg = true;
  iter = 0;

  while (chg && iter < maxIter) {
    chg = false;
    iter++;
    for (let i = cmp.length - 1; i >= 0; i--) {
      const t = cmp[i];
      if (t.isP) continue;

      const succ = successorsMap.get(t.id) || [];
      let ml = Infinity;
      let mlD = null;

      for (let sIdx = 0; sIdx < succ.length; sIdx++) {
        const { task: s, lag: predLag } = succ[sIdx];
        if (s.LS) {
          const d = new Date(s.LS + 'T00:00:00');
          if (!isNaN(d.getTime())) {
            const sd = parseInt(s.startDelay) || 0;
            if (sd > 0) {
              let c = 0;
              let sCount = 0;
              while (c < sd && sCount < 1000) {
                d.setDate(d.getDate() - 1);
                if (!hasAnyWorkDay || isWorkDay(d, wDays, hSet)) c++;
                sCount++;
              }
            } else if (sd < 0) {
              let c = 0;
              let sCount = 0;
              while (c < Math.abs(sd) && sCount < 1000) {
                d.setDate(d.getDate() + 1);
                if (!hasAnyWorkDay || isWorkDay(d, wDays, hSet)) c++;
                sCount++;
              }
            }
            let sCount2 = 0;
            while (hasAnyWorkDay && !isWorkDay(d, wDays, hSet) && sCount2 < 1000) {
              d.setDate(d.getDate() - 1);
              sCount2++;
            }

            const fd = (parseInt(s.finishDelay) || 0) + (parseInt(t.finishDelay) || 0) + predLag;
            if (fd > 0) {
              let c = 0;
              let sCount = 0;
              while (c < fd && sCount < 1000) {
                d.setDate(d.getDate() - 1);
                if (!hasAnyWorkDay || isWorkDay(d, wDays, hSet)) c++;
                sCount++;
              }
            } else if (fd < 0) {
              let c = 0;
              let sCount = 0;
              while (c < Math.abs(fd) && sCount < 1000) {
                d.setDate(d.getDate() + 1);
                if (!hasAnyWorkDay || isWorkDay(d, wDays, hSet)) c++;
                sCount++;
              }
            }
            if ((parseInt(t.duration) || 0) > 0) d.setDate(d.getDate() - 1);
            let sCount3 = 0;
            while (hasAnyWorkDay && !isWorkDay(d, wDays, hSet) && sCount3 < 1000) {
              d.setDate(d.getDate() - 1);
              sCount3++;
            }

            const dTime = d.getTime();
            if (dTime < ml) {
              ml = dTime;
              mlD = toDateKey(d);
            }
          }
        }
      }

      const tLF = mlD || pEnd;
      let tLS = tLF;
      const dL = parseInt(t.duration) || 0;
      const td = new Date(tLF + 'T00:00:00');
      if (!isNaN(td.getTime())) {
        let sCount = 0;
        while (hasAnyWorkDay && !isWorkDay(td, wDays, hSet) && sCount < 1000) {
          td.setDate(td.getDate() - 1);
          sCount++;
        }
        if (dL > 1) {
          let c = 0;
          let sCount2 = 0;
          while (c < dL - 1 && sCount2 < 1000) {
            td.setDate(td.getDate() - 1);
            if (!hasAnyWorkDay || isWorkDay(td, wDays, hSet)) c++;
            sCount2++;
          }
        }
        tLS = toDateKey(td);
      }

      if (t.LF !== tLF || t.LS !== tLS) {
        t.LF = tLF;
        t.LS = tLS;
        chg = true;
      }
    }
  }

  // 7. Holguras y Ruta Crítica
  for (let i = 0; i < cmp.length; i++) {
    const t = cmp[i];
    if (!t.isP) {
      const es = new Date(t.ES + 'T00:00:00');
      const ls = new Date(t.LS + 'T00:00:00');
      if (!isNaN(es.getTime()) && !isNaN(ls.getTime())) {
        if (ls.getTime() < es.getTime()) {
          t.TF = -(getWorkDays(t.LS, t.ES, wDays, hSet) - 1);
          t.crit = true;
        } else if (ls.getTime() === es.getTime()) {
          t.TF = 0;
          t.crit = true;
        } else {
          t.TF = getWorkDays(t.ES, t.LS, wDays, hSet) - 1;
          t.crit = t.TF <= 0;
        }
      }
    }
  }

  // 8. Resumen global del proyecto
  const val = cmp.filter((t) => t.ES && t.EF && !t.isP);
  let pSum = { dur: 0, start: '-', end: '-', cost: 0, prog: 0 };
  if (val.length > 0) {
    const vES = val.map((c) => new Date(c.ES + 'T00:00:00').getTime()).filter((v) => !isNaN(v));
    const vEF = val.map((c) => new Date(c.EF + 'T00:00:00').getTime()).filter((v) => !isNaN(v));
    const s = vES.length > 0 ? toDateKey(new Date(Math.min(...vES))) : val[0].ES;
    const e = vEF.length > 0 ? toDateKey(new Date(Math.max(...vEF))) : val[0].EF;
    const cst = val.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
    const cp = val.reduce((acc, t) => acc + (Number(t.cost) || 0) * ((Number(t.progress) || 0) / 100), 0);
    pSum = {
      start: s,
      end: e,
      dur: getWorkDays(s, e, wDays, hSet),
      cost: cst,
      prog: cst > 0 ? (cp / cst) * 100 : val.reduce((a, t) => a + (Number(t.progress) || 0), 0) / (val.length || 1),
    };
  }

  // 9. Cálculo EVM (Earned Value Management)
  let pv = 0;
  let ev = 0;
  const ct = new Date(statusDate + 'T00:00:00').getTime();
  if (!isNaN(ct)) {
    for (let i = 0; i < cmp.length; i++) {
      const t = cmp[i];
      if (!t.isP) {
        const st = new Date(t.ES + 'T00:00:00').getTime();
        const et = new Date(t.EF + 'T00:00:00').getTime();
        if (isNaN(st) || isNaN(et)) continue;
        const d = Math.max(1, (et - st) / (1000 * 3600 * 24));
        const c = Number(t.cost || 0);
        const p = ct >= et ? 100 : ct > st ? (((ct - st) / (1000 * 3600 * 24)) / d) * 100 : 0;
        pv += (p / 100) * c;
        ev += ((Number(t.progress) || 0) / 100) * c;
      }
    }
  }
  const evm = {
    pv,
    ev,
    spi: pv > 0 ? ev / pv : ev > 0 ? 1 : 1,
    sv: ev - pv,
  };

  // 10. Helper de Estado Semántico
  const getTaskStat = (t) => {
    if (t.isP) return { lbl: 'Partida', cl: 'text-amber-300' };
    if (t.manualStatus && t.manualStatus !== 'AUTO') {
      if (t.manualStatus === 'Completada') return { lbl: 'Completada', cl: 'text-emerald-400' };
      if (t.manualStatus === 'Con Retraso') return { lbl: 'Con Retraso', cl: 'text-rose-400', isR: true };
      if (t.manualStatus === 'Pendiente') return { lbl: 'Pendiente', cl: 'text-slate-400' };
      return { lbl: 'En Plazo', cl: 'text-cyan-300' };
    }
    const prog = Number(t.progress) || 0;
    if (prog >= 100) return { lbl: 'Completada', cl: 'text-emerald-400' };
    const cutTime = new Date(statusDate + 'T00:00:00').getTime();
    const sT = new Date(t.ES + 'T00:00:00').getTime();
    const eT = new Date(t.EF + 'T00:00:00').getTime();
    if (isNaN(cutTime) || isNaN(sT) || isNaN(eT) || cutTime < sT) return { lbl: 'Pendiente', cl: 'text-slate-400' };
    const eProg = eT === sT ? (cutTime >= eT ? 100 : 0) : cutTime < eT ? ((cutTime - sT) / (eT - sT)) * 100 : 100;
    if (prog < eProg - 5) {
      return t.crit
        ? { lbl: 'Desv. Crítica', cl: 'text-rose-500 font-bold', isR: true }
        : { lbl: 'Con Retraso', cl: 'text-amber-400', isR: true };
    }
    return { lbl: 'En Plazo', cl: 'text-cyan-300' };
  };

  // 11. Datos de Dashboard
  let cpCount = 0;
  let atCount = 0;
  let plCount = 0;
  let mo = 0;
  let mat = 0;
  let eq = 0;

  for (let i = 0; i < cmp.length; i++) {
    const t = cmp[i];
    if (!t.isP) {
      const s = getTaskStat(t);
      if (s.lbl === 'Completada') cpCount++;
      else if (s.isR) atCount++;
      else plCount++;

      const r = resourceMap.get(t.resourceId);
      const tCost = Number(t.cost) || 0;
      if (r) {
        if (r.group?.toLowerCase().includes('obra') || r.type === 'Trabajo') mo += tCost;
        else if (r.type === 'Material') mat += tCost;
        else eq += tCost;
      } else {
        eq += tCost;
      }
    }
  }

  const totalLeafTasks = cpCount + atCount + plCount;
  const dashData = {
    cp: cpCount,
    at: atCount,
    pl: plCount,
    tot: totalLeafTasks,
    mo,
    mat,
    eq,
  };

  // 12. Curva S
  const scurveData = [];
  if (cmp.length > 0 && pSum.dur > 0) {
    const step = pSum.dur / 10;
    const minTime = new Date(pSum.start + 'T00:00:00').getTime();
    const statTime = new Date(statusDate + 'T00:00:00').getTime();
    for (let i = 0; i <= 10; i++) {
      const currT = new Date(minTime + i * step * 24 * 3600 * 1000).getTime();
      let curvePV = 0;
      let curveEV = 0;
      for (let j = 0; j < cmp.length; j++) {
        const t = cmp[j];
        if (!t.isP) {
          const ts = new Date(t.ES + 'T00:00:00').getTime();
          const te = new Date(t.EF + 'T00:00:00').getTime();
          const c = Number(t.cost || 0);
          if (!isNaN(ts) && !isNaN(te)) {
            const dur = Math.max(1, (te - ts) / (1000 * 3600 * 24));
            const p = currT >= te ? 100 : currT > ts ? (((currT - ts) / (1000 * 3600 * 24)) / dur) * 100 : 0;
            curvePV += (p / 100) * c;
            if (currT <= statTime) {
              const a =
                currT >= te
                  ? (Number(t.progress) || 0)
                  : currT > ts
                  ? (((currT - ts) / (1000 * 3600 * 24)) / dur) * (Number(t.progress) || 0)
                  : 0;
              curveEV += (a / 100) * c;
            }
          }
        }
      }
      scurveData.push({
        x: (i / 10) * 1000,
        label: new Date(currT).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        pvY: 300 - (curvePV / (pSum.cost || 1)) * 280,
        evY: currT <= statTime ? 300 - (curveEV / (pSum.cost || 1)) * 280 : null,
        pvVal: curvePV,
        evVal: currT <= statTime ? curveEV : null,
      });
    }
  }

  // 13. Nodos PERT
  const lf = cmp.filter((t) => !t.isP && t.level > 0);
  const cols = {};
  lf.forEach((t) => (cols[t.id] = 0));
  let chgNet = true;
  let lp = 0;
  while (chgNet && lp < 100) {
    chgNet = false;
    lp++;
    for (let i = 0; i < lf.length; i++) {
      const t = lf[i];
      if (t.predecessors) {
        let mx = -1;
        const preds = String(t.predecessors).split(',');
        for (let p = 0; p < preds.length; p++) {
          const id = parsePredecessor(preds[p]).id;
          if (cols[id] !== undefined && cols[id] > mx) mx = cols[id];
        }
        if (mx >= 0 && cols[t.id] <= mx) {
          cols[t.id] = mx + 1;
          chgNet = true;
        }
      }
    }
  }

  const grid = {};
  let mc = 0;
  let mr = 0;
  lf.forEach((t) => {
    const c = cols[t.id] || 0;
    if (!grid[c]) grid[c] = [];
    grid[c].push(t);
    if (c > mc) mc = c;
    if (grid[c].length > mr) mr = grid[c].length;
  });

  const nds = [];
  const W = 220;
  const H = 90;
  const XS = 300;
  const YS = 130;
  const tH = Math.max(mr * YS, 600);

  const colKeys = Object.keys(grid);
  for (let k = 0; k < colKeys.length; k++) {
    const c = parseInt(colKeys[k]);
    const tsk = grid[c];
    const sy = (tH - tsk.length * YS) / 2;
    for (let i = 0; i < tsk.length; i++) {
      nds.push({ ...tsk[i], x: c * XS + 50, y: sy + i * YS + 50, w: W, h: H });
    }
  }

  return {
    tasks: cmp,
    end: pEnd,
    pSum,
    evm,
    scurveData,
    netNodes: { nds, w: (mc + 1) * XS + 150, h: tH + 100 },
    dashData,
    hasCycle,
  };
};
