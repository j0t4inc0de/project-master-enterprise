import React, { Component, useEffect } from 'react';
import { useUIStore } from './stores/uiStore';
import { useProjectStore } from './stores/projectStore';
import { Header } from './components/Header';
import { GanttView } from './components/Gantt/GanttView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { NetworkView } from './components/Network/NetworkView';
import { ScurveView } from './components/Scurve/ScurveView';
import { ResourcesView } from './components/Resources/ResourcesView';
import { CalendarView } from './components/Calendar/CalendarView';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8">
          <i className="fa-solid fa-triangle-exclamation text-6xl text-rose-500 mb-6"></i>
          <h1 className="text-3xl font-black text-rose-400 mb-4">Error Inesperado</h1>
          <p className="text-slate-400 mb-6 text-center max-w-lg">
            El sistema ha detenido el renderizado para proteger tus datos.
          </p>
          <pre className="text-xs text-rose-200 bg-black p-4 rounded max-w-2xl overflow-auto mb-4">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-rose-600 hover:bg-rose-500 px-6 py-3 rounded font-bold shadow-lg transition-colors"
          >
            Restaurar de Fábrica y Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainContent() {
  const activeTab = useUIStore((state) => state.activeTab);

  return (
    <main className="flex-1 overflow-hidden relative w-full h-full">
      {activeTab === 'gantt' && <GanttView />}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'network' && <NetworkView />}
      {activeTab === 'scurve' && <ScurveView />}
      {activeTab === 'resources' && <ResourcesView />}
      {activeTab === 'calendar' && <CalendarView />}
    </main>
  );
}

export default function App() {
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key ? e.key.toLowerCase() : '';

      // Redo: Ctrl+Y / Cmd+Y o Ctrl+Shift+Z / Cmd+Shift+Z
      if (key === 'y' || (e.shiftKey && key === 'z')) {
        e.preventDefault();
        redo();
      }
      // Undo: Ctrl+Z / Cmd+Z (sin Shift)
      else if (!e.shiftKey && key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen bg-[#0f172a] text-sm overflow-hidden font-sans">
        <Header />
        <MainContent />
      </div>
    </ErrorBoundary>
  );
}
