import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity, Terminal, ScrollText, X, Download, Trash2,
  Play, Pause, Search, Settings, Cpu, Eye, Zap,
  RefreshCw, MousePointer2, Layers, Sun, Wand2, Maximize
} from 'lucide-react';
import { DebugLogger, DebugCategory, LogEntry } from '../../../../utils/DebugLogger';
import { useGameSession } from '../../../../context/GameSessionContext';

interface DebugPanelModalProps {
  onClose: () => void;
}

type Tab = 'visual' | 'console' | 'logs';

const CATEGORY_ICONS: Record<DebugCategory, React.ReactNode> = {
  vision: <Eye className="w-4 h-4" />,
  lighting: <Sun className="w-4 h-4" />,
  render: <Layers className="w-4 h-4" />,
  sync: <RefreshCw className="w-4 h-4" />,
  worker: <Cpu className="w-4 h-4" />,
  input: <MousePointer2 className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  zones: <Maximize className="w-4 h-4" />
};

type Preset = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  categories: Partial<Record<DebugCategory, boolean>>;
  filter: string;
};

const PRESETS: Preset[] = [
  {
    id: 'vision',
    name: 'Vision & Fog',
    icon: <Eye className="w-4 h-4" />,
    description: 'Debug Line-of-sight & Polygon calculation',
    categories: { vision: true, worker: true },
    filter: 'Visibility|Polygon|Optimizer|ImageProcessing'
  },
  {
    id: 'sync',
    name: 'Sync Logic',
    icon: <RefreshCw className="w-4 h-4" />,
    description: 'Socket events & data synchronization',
    categories: { sync: true, system: true },
    filter: 'Sync|Socket|Request|Conflict'
  },
  {
    id: 'worker',
    name: 'Worker Health',
    icon: <Cpu className="w-4 h-4" />,
    description: 'Worker lifecycle & crash monitoring',
    categories: { worker: true, system: true },
    filter: 'WorkerManager|HealthCheck|Crash|Restart'
  },
  {
    id: 'input',
    name: 'Input & Perms',
    icon: <MousePointer2 className="w-4 h-4" />,
    description: 'User actions & permission validation',
    categories: { input: true, system: true },
    filter: 'ActionHandler|Permission|Validate'
  },
  {
    id: 'perf',
    name: 'Performance',
    icon: <Zap className="w-4 h-4" />,
    description: 'Timing stats & optimization metrics',
    categories: { render: true, vision: true },
    filter: 'Stats|Calc|Optimize|Duration'
  },
  {
    id: 'zones',
    name: 'Zones & Areas',
    icon: <Maximize className="w-4 h-4" />,
    description: 'Light, Audio & Trigger zones',
    categories: { zones: true, worker: true },
    filter: 'Zones|Layer'
  }
];

const KNOWN_MODULES = [
  'WorkerManager', 'WorkerHost', 'VisibilityModule', 'ImageProcessing',
  'VisibilityService', 'PolygonOptimizer', 'SyncQueue', 'SyncCache',
  'SmartSyncService', 'ActionHandler', 'TokenActions', 'AnimationEngine',
  'MapOrchestrator', 'Socket', 'ZonesModule', 'ZonesLayer'
];

export const DebugPanelModal: React.FC<DebugPanelModalProps> = ({ onClose }) => {
  const { ui, toggleDebugLayer } = useGameSession();
  const [activeTab, setActiveTab] = useState<Tab>('console');

  // Logger Config State
  const [config, setConfig] = useState(DebugLogger.getConfig());

  // Live Logs State
  const [logs, setLogs] = useState<LogEntry[]>(DebugLogger.getHistory());
  const [logFilter, setLogFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to DebugLogger updates
  useEffect(() => {
    // Config changes
    const unsubConfig = DebugLogger.subscribe(() => {
      setConfig(DebugLogger.getConfig());
      setLogs(DebugLogger.getHistory()); // Sync logs (e.g. after clear)
    });

    // New logs
    const unsubLogs = DebugLogger.subscribeToLogs((entry) => {
      setLogs(prev => [...prev.slice(-999), entry]); // Keep last 1000 in UI
    });

    return () => {
      unsubConfig();
      unsubLogs();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filtered Logs for Viewer
  const filteredLogs = useMemo(() => {
    if (!logFilter) return logs;
    const lower = logFilter.toLowerCase();
    return logs.filter(l =>
      l.category.includes(lower) ||
      l.message.toLowerCase().includes(lower) ||
      l.where.toLowerCase().includes(lower)
    );
  }, [logs, logFilter]);

  // Handlers
  const handleCategoryToggle = (cat: DebugCategory) => {
    const newCats = { ...config.categories, [cat]: !config.categories[cat] };
    DebugLogger.setLogConfigProperties({ categories: newCats });
  };

  const handleMasterToggle = () => {
    DebugLogger.setLogConfigProperties({ enabled: !config.enabled });
  };

  const handlePerfToggle = () => {
    DebugLogger.setLogConfigProperties({ performance: !config.performance });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    DebugLogger.setFilter(e.target.value || null);
  };

  const handleApplyPreset = (preset: Preset) => {
    // 1. Reset all categories first
    const newCategories = { ...config.categories };
    (Object.keys(newCategories) as DebugCategory[]).forEach(k => newCategories[k] = false);

    // 2. Enable specific categories
    (Object.keys(preset.categories) as DebugCategory[]).forEach(k => {
      if (preset.categories[k]) newCategories[k] = true;
    });

    // 3. Apply updates
    DebugLogger.setLogConfigProperties({
      categories: newCategories,
      filter: preset.filter
    });
  };

  const handleModuleToggle = (moduleName: string) => {
    // Current filter might be "ModuleA|ModuleB"
    const currentFilter = config.filter || '';
    const currentModules = currentFilter.split('|').filter(s => KNOWN_MODULES.includes(s));

    let newModules: string[];
    if (currentModules.includes(moduleName)) {
      newModules = currentModules.filter(m => m !== moduleName);
    } else {
      newModules = [...currentModules, moduleName];
    }

    const newFilter = newModules.length > 0 ? newModules.join('|') : null;
    DebugLogger.setFilter(newFilter);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.enabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Diagnostics</h2>
              <p className="text-xs text-zinc-400">Advanced Debugging & Performance Tools</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-zinc-800 bg-zinc-900/30">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'console' ? 'border-primary text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            <Settings className="w-4 h-4" />
            Console Control
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'border-primary text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            <ScrollText className="w-4 h-4" />
            Live Log Viewer
            <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">{logs.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'visual' ? 'border-primary text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            <Eye className="w-4 h-4" />
            Visual Debugger
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-zinc-950/50 relative">

          {/* --- CONSOLE CONTROL --- */}
          {activeTab === 'console' && (
            <div className="p-6 h-full overflow-y-auto custom-scrollbar">

              {/* Master Switch */}
              <div className="flex items-center justify-between mb-8 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div>
                  <h3 className="text-white font-medium">Global Logging</h3>
                  <p className="text-sm text-zinc-500">Enable or disable all debug logs from the application.</p>
                </div>
                <button
                  onClick={handleMasterToggle}
                  className={`w-14 h-7 rounded-full transition-colors relative ${config.enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${config.enabled ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {/* Console Filter */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Console Filter</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={config.filter || ''}
                    onChange={handleFilterChange}
                    placeholder="Filter console output (Regex or Text)..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  {config.filter && (
                    <button onClick={() => DebugLogger.setFilter(null)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Smart Filters (Presets) */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Smart Filters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left group"
                    >
                      <div className="bg-zinc-950 p-2 rounded-lg text-zinc-400 group-hover:text-white transition-colors border border-zinc-800">
                        {preset.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-200 group-hover:text-primary transition-colors">{preset.name}</div>
                        <div className="text-[10px] text-zinc-500 leading-tight mt-1">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Component Focus (Unitary) */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Component Focus</h3>
                <div className="flex flex-wrap gap-2">
                  {KNOWN_MODULES.map(mod => {
                    const isActive = (config.filter || '').split('|').includes(mod);
                    return (
                      <button
                        key={mod}
                        onClick={() => handleModuleToggle(mod)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                          ${isActive
                            ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'}
                        `}
                      >
                        {mod}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  Select multiple components to isolate their logs (OR logic).
                </p>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Log Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(config.categories) as DebugCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border transition-all
                        ${config.categories[cat]
                          ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                          : 'bg-zinc-950 border-zinc-800 opacity-60 hover:opacity-100'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${config.categories[cat] ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                          {CATEGORY_ICONS[cat]}
                        </div>
                        <span className={`text-sm font-medium ${config.categories[cat] ? 'text-white' : 'text-zinc-500'}`}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${config.categories[cat] ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Actions & Metrics</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => DebugLogger.downloadLogs()}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => DebugLogger.perfReport()}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700"
                  >
                    <Zap className="w-4 h-4" />
                    Print Perf Report
                  </button>
                  <button
                    onClick={() => DebugLogger.clear()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear History
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* --- LIVE LOG VIEWER --- */}
          {activeTab === 'logs' && (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="p-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/30">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-colors ${autoScroll ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                >
                  {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  Auto-scroll
                </button>
                <button onClick={() => DebugLogger.clear()} className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-900/50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Log List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs p-2 space-y-0.5">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                    <Terminal className="w-8 h-8 mb-2 opacity-50" />
                    <p>No logs found</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="group flex items-start gap-2 p-1 hover:bg-white/5 rounded">
                      <span className="text-zinc-500 shrink-0 w-[60px]">{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 w-[70px] text-center select-none`}
                        style={{ backgroundColor: `${log.category === 'vision' ? '#0ea5e9' : log.category === 'render' ? '#6366f1' : '#64748b'}20`, color: log.category === 'vision' ? '#38bdf8' : log.category === 'render' ? '#818cf8' : '#94a3b8' }}
                      >
                        {log.category}
                      </span>
                      <span className={`shrink-0 font-bold ${log.level === 'warn' ? 'text-yellow-500' : log.level === 'error' ? 'text-red-500' : log.level === 'success' ? 'text-green-500' : 'text-zinc-400'}`}>
                        {log.level === 'info' ? 'INF' : log.level.toUpperCase().slice(0, 3)}
                      </span>
                      <div className="flex-1 break-words">
                        <span className="text-zinc-400 font-semibold mr-2">[{log.where}:{log.what}]</span>
                        <span className={log.level === 'error' ? 'text-red-400' : 'text-zinc-300'}>{log.message}</span>
                        {log.data && (
                          <div className="mt-1 ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <pre className="text-[10px] text-zinc-500">{JSON.stringify(log.data)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* --- VISUAL DEBUGGER --- */}
          {activeTab === 'visual' && (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-md w-full bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Performance Overlay</h3>
                <p className="text-zinc-400 mb-6 text-sm">
                  Displays a real-time HUD on the map showing FPS, layer render times, and particle counts. useful for optimizing complex maps.
                </p>

                <button
                  onClick={toggleDebugLayer}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${ui.showDebugLayer ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary/90 text-white'}`}
                >
                  {ui.showDebugLayer ? 'Disable Overlay' : 'Enable Overlay'}
                </button>

                {/* Diagnostics Config */}
                {ui.showDebugLayer && (
                  <div className="mt-8 grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-2">
                    <div className="col-span-2 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Overlay Settings
                    </div>

                    <button
                      onClick={() => DebugLogger.setLogConfigProperties({ diagnostics: { ...config.diagnostics, showFps: !config.diagnostics.showFps } })}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${config.diagnostics.showFps ? 'bg-zinc-800 border-green-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.diagnostics.showFps ? 'bg-green-500' : 'bg-zinc-700'}`} />
                      Show FPS
                    </button>

                    <button
                      onClick={() => DebugLogger.setLogConfigProperties({ diagnostics: { ...config.diagnostics, showFrameTime: !config.diagnostics.showFrameTime } })}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${config.diagnostics.showFrameTime ? 'bg-zinc-800 border-amber-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.diagnostics.showFrameTime ? 'bg-amber-500' : 'bg-zinc-700'}`} />
                      Show Frame Time
                    </button>

                    <button
                      onClick={() => DebugLogger.setLogConfigProperties({ diagnostics: { ...config.diagnostics, showLayerBreakdown: !config.diagnostics.showLayerBreakdown } })}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${config.diagnostics.showLayerBreakdown ? 'bg-zinc-800 border-slate-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.diagnostics.showLayerBreakdown ? 'bg-slate-500' : 'bg-zinc-700'}`} />
                      Layer Breakdown
                    </button>

                    <button
                      onClick={() => DebugLogger.setLogConfigProperties({ diagnostics: { ...config.diagnostics, detailedStats: !config.diagnostics.detailedStats } })}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${config.diagnostics.detailedStats ? 'bg-zinc-800 border-indigo-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.diagnostics.detailedStats ? 'bg-indigo-500' : 'bg-zinc-700'}`} />
                      Detailed Stats
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
