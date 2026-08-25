---
name: gantt-performance
description: Optimize Carta Gantt SVG rendering, scroll sync, and CPM graph engine performance for 500+ tasks at 60 FPS.
---
# Gantt & CPM Performance Expert

Use this skill when auditing or optimizing Carta Gantt rendering, SVG elements, timeline scaling, and CPM graph calculations:

## Core Performance Rules
1. **Offload Heavy Graphs to Web Workers:** Keep all CPM Forward/Backward passes, cycle detection (DFS/Tarjan), and EVM series calculations inside `src/workers/cpmWorker.js` or asynchronous computation to avoid UI thread lag.
2. **Scroll Synchronization via Refs:** Never synchronize table and canvas scrolls using React state updates (triggers re-renders). Always use direct DOM `useRef` and scroll event listeners with lock flags (`syncFromLeft`, `syncFromRight`).
3. **SVG Precedence Arrows:** Batch marker definitions (`<defs>`) in a single root element. Avoid recalculating path coordinates on pure text edits; isolate CPM coordinates from task metadata edits.
4. **Virtualization & Pruning:** When rendering large Gantt charts (>200 tasks), ensure collapsed subtasks are excluded from the visual loop before calculating SVG height and layout metrics.
5. **Color & 3D Bar Integrity:** Preserve the signature CSS gradients (`.bar-3d-blue`, `.bar-3d-red`) and semantic state colors (`emerald` for completed, `rose` for critical/delayed, `amber` for WBS parent phases).
