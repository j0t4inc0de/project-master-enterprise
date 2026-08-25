/**
 * Motor de Cálculo CPM (Critical Path Method), EVM (Earned Value Management) y Curva S
 * Optimizado para alto rendimiento y prevención de dependencias circulares.
 */

export const formatD = (dStr) => {
  if (!dStr) return '-';
  const p = dStr.split('-');
  if (p.length !== 3) return '-';
  return `${p[2]}-${p[1]}-${p[0].substring(2)}`;
};

export const isWorkDay = (d, workingDays = {}, holidays = []) => {
  if (!d || isNaN(d.getTime()) || !workingDays[d.getDay()]) return false;
  const isoDate = d.toISOString().split('T')[0];
  return !holidays.some((h) => h.date === isoDate);
};

export const addWorkDays = (sStr, days, workingDays = {}, holidays = []) => {
  if (!sStr) return sStr;
  let d = new Date(sStr + 'T00:00:00');
  if (isNaN(d.getTime())) return sStr;

  let rem = Math.max(0, parseInt(days) || 0);
  if (rem === 0) {
    while (!isWorkDay(d, workingDays, holidays)) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  let c = 0;
  while (c < rem) {
    d.setDate(d.getDate() + 1);
    if (isWorkDay(d, workingDays, holidays)) c++;
  }
  return d.toISOString().split('T')[0];
};

export const getWorkDays = (sStr, eStr, workingDays = {}, holidays = []) => {
  if (!sStr || !eStr) return 0;
  let s = new Date(sStr + 'T00:00:00');
  let e = new Date(eStr + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;

  let c = 0;
  let t = new Date(s);
  while (t <= e) {
    if (isWorkDay(t, workingDays, holidays)) c++;
    t.setDate(t.getDate() + 1);
  }
  return c;
};

/**
 * Detecta si existen ciclos en las dependencias de las tareas
 */
export const detectCycles = (tasks) => {
  const adj = new Map();
  tasks.forEach((t) => {
    if (t.predecessors) {
      const preds = String(t.predecessors)
        .split(',')
        .map((p) => parseInt(p.trim()))
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
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      if (hasCycleDFS(t.id)) return true;
    }
  }

  return false;
};

/**
 * Función principal que calcula el estado completo del proyecto
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
  const hasCycle = detectCycles(tasks);

  // 1. Clonar tareas y marcar fases padre (isP)
  let cmp = tasks.map((t, i) => ({
    ...t,
    isP: i < tasks.length - 1 && tasks[i + 1].level > t.level,
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
      dashData: { cp: 0, at: 0, pl: 0, tot: 1, mo: 0, mat: 0, eq: 0 },
      hasCycle,
    };
  }

  // 2. Forward Pass: Calcular Early Start (ES) y Early Finish (EF)
  let chg = true;
  let iter = 0;
  const maxIter = hasCycle ? 5 : 50;

  while (chg && iter < maxIter) {
    chg = false;
    iter++;
    let pES = [];

    for (let i = 0; i < cmp.length; i++) {
      let t = cmp[i];
      let tES = startDate;

      if (t.manualStart) {
        let d = new Date(t.manualStart + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          while (!isWorkDay(d, workingDays, holidays)) d.setDate(d.getDate() + 1);
          tES = d.toISOString().split('T')[0];
        }
      } else if (t.predecessors) {
        let mx = 0;
        let mxD = null;
        String(t.predecessors)
          .split(',')
          .forEach((p) => {
            let pr = cmp.find((x) => x.id === parseInt(p.trim()));
            if (pr && pr.EF) {
              let nd = new Date(pr.EF + 'T00:00:00');
              if (!isNaN(nd.getTime())) {
                if ((parseInt(pr.duration) || 0) > 0) nd.setDate(nd.getDate() + 1);
                while (!isWorkDay(nd, workingDays, holidays)) nd.setDate(nd.getDate() + 1);

                let fDelay = parseInt(pr.finishDelay) || 0;
                if (fDelay > 0) {
                  let c = 0;
                  while (c < fDelay) {
                    nd.setDate(nd.getDate() + 1);
                    if (isWorkDay(nd, workingDays, holidays)) c++;
                  }
                }
                while (!isWorkDay(nd, workingDays, holidays)) nd.setDate(nd.getDate() + 1);
                if (nd.getTime() > mx) {
                  mx = nd.getTime();
                  mxD = nd.toISOString().split('T')[0];
                }
              }
            }
          });
        if (mxD) tES = mxD;
      }

      let sDelay = parseInt(t.startDelay) || 0;
      if (sDelay > 0 && !t.manualStart) {
        let nd = new Date(tES + 'T00:00:00');
        if (!isNaN(nd.getTime())) {
          let c = 0;
          while (c < sDelay) {
            nd.setDate(nd.getDate() + 1);
            if (isWorkDay(nd, workingDays, holidays)) c++;
          }
          while (!isWorkDay(nd, workingDays, holidays)) nd.setDate(nd.getDate() + 1);
          tES = nd.toISOString().split('T')[0];
        }
      } else {
        let d = new Date(tES + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          while (!isWorkDay(d, workingDays, holidays)) d.setDate(d.getDate() + 1);
          tES = d.toISOString().split('T')[0];
        }
      }

      pES = pES.slice(0, t.level);
      let pCon = t.level > 1 && pES[t.level - 1] ? pES[t.level - 1] : startDate;
      if (!t.manualStart && new Date(pCon) > new Date(tES)) tES = pCon;

      if (t.isP) {
        pES[t.level] = tES;
      } else {
        let dur = parseInt(t.duration) || 0;
        let ef = addWorkDays(tES, Math.max(0, dur - 1), workingDays, holidays);
        if (t.ES !== tES || t.EF !== ef) {
          t.ES = tES;
          t.EF = ef;
          chg = true;
        }
      }
    }
  }

  // 3. Cálculo de costos avanzados y auto-progreso
  cmp.forEach((t) => {
    if (!t.isP) {
      if (t.resourceId) {
        const res = resources.find((r) => r.id === t.resourceId);
        if (res) {
          let dur = parseInt(t.duration) || 0;
          let rateCost = dur * (res.type === 'Trabajo' ? 8 : 1) * (Number(res.rate) || 0);
          let usageCost = Number(res.costPerUse) || 0;
          t.cost = rateCost + (dur >= 0 ? usageCost : 0);
        }
      }

      if (autoProgress && parseInt(t.duration) > 0 && t.ES && t.EF && !t.manualProgress) {
        const cutT = new Date(statusDate + 'T00:00:00').getTime();
        const sT = new Date(t.ES + 'T00:00:00').getTime();
        const eT = new Date(t.EF + 'T00:00:00').getTime();
        if (!isNaN(cutT) && !isNaN(sT) && !isNaN(eT)) {
          if (cutT >= eT) t.progress = 100;
          else if (cutT <= sT) t.progress = 0;
          else {
            let pWd = getWorkDays(t.ES, statusDate, workingDays, holidays) - 1;
            t.progress = Math.min(99, Math.round((Math.max(0, pWd) / parseInt(t.duration)) * 100));
          }
        }
      }
    }
  });

  // 4. Rollup de Fases Padre
  for (let i = cmp.length - 1; i >= 0; i--) {
    if (cmp[i].isP) {
      let desc = [];
      for (let j = i + 1; j < cmp.length; j++) {
        if (cmp[j].level <= cmp[i].level) break;
        desc.push(cmp[j]);
      }
      let lDesc = desc.filter((d) => !d.isP && d.ES && d.EF);
      if (lDesc.length > 0) {
        let vES = lDesc.map((c) => new Date(c.ES).getTime()).filter((v) => !isNaN(v));
        let vEF = lDesc.map((c) => new Date(c.EF).getTime()).filter((v) => !isNaN(v));
        cmp[i].ES = vES.length > 0 ? new Date(Math.min(...vES)).toISOString().split('T')[0] : lDesc[0].ES;
        cmp[i].EF = vEF.length > 0 ? new Date(Math.max(...vEF)).toISOString().split('T')[0] : lDesc[0].EF;
        cmp[i].cost = lDesc.reduce((s, c) => s + Number(c.cost || 0), 0);
        let cp = lDesc.reduce((s, c) => s + Number(c.cost || 0) * (c.progress / 100), 0);
        cmp[i].progress = cmp[i].cost > 0 ? (cp / cmp[i].cost) * 100 : lDesc.reduce((s, c) => s + c.progress, 0) / lDesc.length;
        cmp[i].duration = getWorkDays(cmp[i].ES, cmp[i].EF, workingDays, holidays);
        if (cmp[i].ES === cmp[i].EF && lDesc.every((x) => parseInt(x.duration) === 0)) cmp[i].duration = 0;
      }
    }
  }

  // 5. Fecha fin global del proyecto (EAC)
  let valEnd = cmp
    .filter((x) => x.EF && !x.isP)
    .map((x) => new Date(x.EF + 'T00:00:00').getTime())
    .filter((x) => !isNaN(x));
  let pEnd = valEnd.length > 0 ? new Date(Math.max(...valEnd)).toISOString().split('T')[0] : startDate;

  // 6. Backward Pass: Late Start (LS) y Late Finish (LF)
  cmp.forEach((t) => {
    t.LF = pEnd;
  });
  chg = true;
  iter = 0;

  while (chg && iter < maxIter) {
    chg = false;
    iter++;
    for (let i = cmp.length - 1; i >= 0; i--) {
      let t = cmp[i];
      if (t.isP) continue;

      let succ = cmp.filter(
        (x) => !x.isP && x.predecessors && String(x.predecessors).split(',').map((p) => p.trim()).includes(String(t.id))
      );
      let ml = Infinity;
      let mlD = null;

      succ.forEach((s) => {
        if (s.LS) {
          let d = new Date(s.LS + 'T00:00:00');
          if (!isNaN(d.getTime())) {
            let sd = parseInt(s.startDelay) || 0;
            if (sd > 0) {
              let c = 0;
              while (c < sd) {
                d.setDate(d.getDate() - 1);
                if (isWorkDay(d, workingDays, holidays)) c++;
              }
            }
            while (!isWorkDay(d, workingDays, holidays)) d.setDate(d.getDate() - 1);

            let fd = parseInt(t.finishDelay) || 0;
            if (fd > 0) {
              let c = 0;
              while (c < fd) {
                d.setDate(d.getDate() - 1);
                if (isWorkDay(d, workingDays, holidays)) c++;
              }
            }
            if ((parseInt(t.duration) || 0) > 0) d.setDate(d.getDate() - 1);
            while (!isWorkDay(d, workingDays, holidays)) d.setDate(d.getDate() - 1);

            if (d.getTime() < ml) {
              ml = d.getTime();
              mlD = d.toISOString().split('T')[0];
            }
          }
        }
      });

      let tLF = mlD || pEnd;
      let tLS = tLF;
      let dL = parseInt(t.duration) || 0;
      let td = new Date(tLF + 'T00:00:00');
      if (!isNaN(td.getTime()) && dL > 1) {
        let c = 0;
        while (c < dL - 1) {
          td.setDate(td.getDate() - 1);
          if (isWorkDay(td, workingDays, holidays)) c++;
        }
        tLS = td.toISOString().split('T')[0];
      }

      if (t.LF !== tLF || t.LS !== tLS) {
        t.LF = tLF;
        t.LS = tLS;
        chg = true;
      }
    }
  }

  // 7. Holguras y Ruta Crítica
  cmp.forEach((t) => {
    if (!t.isP) {
      let es = new Date(t.ES + 'T00:00:00');
      let ls = new Date(t.LS + 'T00:00:00');
      if (!isNaN(es.getTime()) && !isNaN(ls.getTime())) {
        t.TF = Math.ceil(Math.abs(ls - es) / (1000 * 3600 * 24));
        t.crit = t.TF <= 0;
      }
    }
  });

  // 8. Resumen global del proyecto
  let val = cmp.filter((t) => t.ES && t.EF && !t.isP);
  let pSum = { dur: 0, start: '-', end: '-', cost: 0, prog: 0 };
  if (val.length > 0) {
    let vES = val.map((c) => new Date(c.ES).getTime()).filter((v) => !isNaN(v));
    let vEF = val.map((c) => new Date(c.EF).getTime()).filter((v) => !isNaN(v));
    let s = vES.length > 0 ? new Date(Math.min(...vES)).toISOString().split('T')[0] : val[0].ES;
    let e = vEF.length > 0 ? new Date(Math.max(...vEF)).toISOString().split('T')[0] : val[0].EF;
    let cst = val.reduce((acc, t) => acc + Number(t.cost || 0), 0);
    let cp = val.reduce((acc, t) => acc + Number(t.cost || 0) * (t.progress / 100), 0);
    pSum = {
      start: s,
      end: e,
      dur: getWorkDays(s, e, workingDays, holidays),
      cost: cst,
      prog: cst > 0 ? (cp / cst) * 100 : val.reduce((a, t) => a + t.progress, 0) / val.length,
    };
  }

  // 9. Cálculo EVM (Earned Value Management)
  let pv = 0,
    ev = 0;
  const ct = new Date(statusDate + 'T00:00:00').getTime();
  if (!isNaN(ct)) {
    cmp
      .filter((t) => !t.isP)
      .forEach((t) => {
        let st = new Date(t.ES + 'T00:00:00').getTime();
        let et = new Date(t.EF + 'T00:00:00').getTime();
        if (isNaN(st) || isNaN(et)) return;
        let d = Math.max(1, (et - st) / (1000 * 3600 * 24));
        let c = Number(t.cost || 0);
        let p = ct >= et ? 100 : ct > st ? (((ct - st) / (1000 * 3600 * 24)) / d) * 100 : 0;
        pv += (p / 100) * c;
        ev += (t.progress / 100) * c;
      });
  }
  const evm = {
    pv,
    ev,
    spi: pv > 0 ? ev / pv : ev > 0 ? 1 : 0,
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
    if (t.progress >= 100) return { lbl: 'Completada', cl: 'text-emerald-400' };
    const cutTime = new Date(statusDate + 'T00:00:00').getTime();
    const sT = new Date(t.ES + 'T00:00:00').getTime();
    const eT = new Date(t.EF + 'T00:00:00').getTime();
    if (isNaN(cutTime) || isNaN(sT) || isNaN(eT) || cutTime < sT) return { lbl: 'Pendiente', cl: 'text-slate-400' };
    let eProg = cutTime < eT ? ((cutTime - sT) / (eT - sT)) * 100 : 100;
    if (t.progress < eProg - 5) {
      return t.crit
        ? { lbl: 'Desv. Crítica', cl: 'text-rose-500 font-bold', isR: true }
        : { lbl: 'Con Retraso', cl: 'text-amber-400', isR: true };
    }
    return { lbl: 'En Plazo', cl: 'text-cyan-300' };
  };

  // 11. Datos de Dashboard
  let cpCount = 0,
    atCount = 0,
    plCount = 0,
    mo = 0,
    mat = 0,
    eq = 0;
  cmp
    .filter((t) => !t.isP)
    .forEach((t) => {
      let s = getTaskStat(t);
      if (s.lbl === 'Completada') cpCount++;
      else if (s.isR) atCount++;
      else plCount++;

      let r = resources.find((x) => x.id === t.resourceId);
      if (r) {
        if (r.group?.toLowerCase().includes('obra') || r.type === 'Trabajo') mo += t.cost;
        else if (r.type === 'Material') mat += t.cost;
        else eq += t.cost;
      } else {
        eq += t.cost;
      }
    });
  const dashData = {
    cp: cpCount,
    at: atCount,
    pl: plCount,
    tot: cpCount + atCount + plCount || 1,
    mo,
    mat,
    eq,
  };

  // 12. Curva S
  let scurveData = [];
  if (cmp.length > 0 && pSum.dur > 0) {
    const step = pSum.dur / 10;
    const minTime = new Date(pSum.start + 'T00:00:00').getTime();
    const statTime = new Date(statusDate + 'T00:00:00').getTime();
    for (let i = 0; i <= 10; i++) {
      let currT = new Date(minTime + i * step * 24 * 3600 * 1000).getTime();
      let curvePV = 0,
        curveEV = 0;
      cmp
        .filter((t) => !t.isP)
        .forEach((t) => {
          let ts = new Date(t.ES + 'T00:00:00').getTime();
          let te = new Date(t.EF + 'T00:00:00').getTime();
          let c = Number(t.cost || 0);
          if (!isNaN(ts) && !isNaN(te)) {
            let dur = Math.max(1, (te - ts) / (1000 * 3600 * 24));
            let p = currT >= te ? 100 : currT > ts ? (((currT - ts) / (1000 * 3600 * 24)) / dur) * 100 : 0;
            curvePV += (p / 100) * c;
            if (currT <= statTime) {
              let a = currT >= te ? t.progress : currT > ts ? (((currT - ts) / (1000 * 3600 * 24)) / dur) * t.progress : 0;
              curveEV += (a / 100) * c;
            }
          }
        });
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
  let lf = cmp.filter((t) => !t.isP && t.level > 0);
  let cols = {};
  lf.forEach((t) => (cols[t.id] = 0));
  let chgNet = true;
  let lp = 0;
  while (chgNet && lp < 100) {
    chgNet = false;
    lp++;
    lf.forEach((t) => {
      if (t.predecessors) {
        let mx = -1;
        String(t.predecessors)
          .split(',')
          .forEach((p) => {
            let id = parseInt(p.trim());
            if (cols[id] !== undefined && cols[id] > mx) mx = cols[id];
          });
        if (mx >= 0 && cols[t.id] <= mx) {
          cols[t.id] = mx + 1;
          chgNet = true;
        }
      }
    });
  }
  let grid = {};
  let mc = 0;
  let mr = 0;
  lf.forEach((t) => {
    let c = cols[t.id] || 0;
    if (!grid[c]) grid[c] = [];
    grid[c].push(t);
    if (c > mc) mc = c;
    if (grid[c].length > mr) mr = grid[c].length;
  });
  let nds = [];
  const W = 220,
    H = 90,
    XS = 300,
    YS = 130;
  const tH = Math.max(mr * YS, 600);
  Object.keys(grid).forEach((cStr) => {
    let c = parseInt(cStr);
    let tsk = grid[c];
    let sy = (tH - tsk.length * YS) / 2;
    tsk.forEach((t, i) => nds.push({ ...t, x: c * XS + 50, y: sy + i * YS + 50, w: W, h: H }));
  });

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
