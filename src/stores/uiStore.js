import { create } from 'zustand';

export const useUIStore = create((set) => ({
  activeTab: 'gantt',
  leftWidth: 55,
  zoom: 24,
  autoLink: true,
  showLinks: true,
  searchQuery: '',
  taskFilter: 'ALL', // 'ALL' | 'CRITICAL' | 'DELAYED'
  resFilters: { name: '', type: 'ALL', group: 'ALL', accrual: 'ALL' },
  collapsed: [],
  hoverDonut: null,
  hoverScurve: null,
  excelModalOpen: false,
  projectsDrawerOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setLeftWidth: (leftWidth) => set({ leftWidth }),
  setZoom: (zoom) => set({ zoom: Math.max(8, Math.min(60, zoom)) }),
  setAutoLink: (autoLink) => set({ autoLink }),
  setShowLinks: (showLinks) => set({ showLinks }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTaskFilter: (taskFilter) => set({ taskFilter }),
  setResFilters: (resFilters) => set({ resFilters }),
  setHoverDonut: (hoverDonut) => set({ hoverDonut }),
  setHoverScurve: (hoverScurve) => set({ hoverScurve }),
  setExcelModalOpen: (excelModalOpen) => set({ excelModalOpen }),
  setProjectsDrawerOpen: (projectsDrawerOpen) => set({ projectsDrawerOpen }),

  toggleCollapse: (id) =>
    set((state) => ({
      collapsed: state.collapsed.includes(id)
        ? state.collapsed.filter((x) => x !== id)
        : [...state.collapsed, id],
    })),
}));
