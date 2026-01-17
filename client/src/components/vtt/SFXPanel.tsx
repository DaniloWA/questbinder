import React, { useState, useRef } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { CloudRain, Snowflake, Wind, X, GripHorizontal, AlignHorizontalJustifyStart, Timer, Palette, Scaling, Move, Sliders, Library, MonitorPlay, Save } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { SFXConfig, SFXParticleConfig, SFXFogConfig } from '../../types/models';
import { SFXPresets } from './SFXPresets';
import { SFXEditor } from './SFXEditor';
import { SFXPreview } from './SFXPreview';

interface SFXPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SFXPanel: React.FC<SFXPanelProps> = ({ isOpen, onClose }) => {
  const { activeScene, updateSceneData } = useGameSession();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'editor' | 'studio'>('editor');

  // --- Draggable State ---
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const dragRef = useRef<{ isDragging: boolean, startX: number, startY: number, initialX: number, initialY: number; }>({
    isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0
  });

  const sfx = activeScene?.sfx || {};

  // Local Draft State for Editor Tab (initially synced with scene)
  const [editorConfig, setEditorConfig] = useState<SFXConfig>(sfx);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Reset editor config when panel opens or scene changes
  React.useEffect(() => {
    if (isOpen && activeScene?.sfx) {
      setEditorConfig(activeScene.sfx);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, activeScene?.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.initialX + dx),
        y: Math.max(0, dragRef.current.initialY + dy)
      });
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen || !activeScene) return null;

  const handleEditorChange = (newConfig: SFXConfig) => {
    setEditorConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleSaveEditor = () => {
    updateSceneData(activeScene.id, { sfx: editorConfig });
    setHasUnsavedChanges(false);
  };

  const handleResetEditor = () => {
    setEditorConfig(activeScene.sfx || {});
    setHasUnsavedChanges(false);
  };

  const applyPreset = (config: SFXConfig) => {
    updateSceneData(activeScene.id, { sfx: config });
    // Also update the editor draft to match so they are in sync
    setEditorConfig(config);
    setHasUnsavedChanges(false);
  };

  return (
    <div
      className="fixed z-50 w-[900px] h-[700px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3 text-zinc-100 font-bold tracking-wide text-lg">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/30">
            <GripHorizontal className="w-5 h-5 text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">SFX Studio Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'editor' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'studio' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Library className="w-3.5 h-3.5" />
              Library
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        {activeTab === 'editor' ? (
          <div className="flex w-full h-full">
            {/* Left: Controls */}
            <div className="w-[400px] bg-zinc-900/30 border-r border-zinc-800/50 flex flex-col relative z-20 shadow-xl">
              <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/80 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Configuration
                </h3>
                {hasUnsavedChanges && (
                  <span className="text-[10px] text-amber-500 font-bold px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <SFXEditor config={editorConfig} onChange={handleEditorChange} />
              </div>

              {/* Editor Footer Actions */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
                <button
                  onClick={handleResetEditor}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveEditor}
                  disabled={!hasUnsavedChanges}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Apply to Scene
                </button>
              </div>
            </div>

            {/* Right: Live Preview (Large) */}
            <div className="flex-1 bg-black/40 relative flex flex-col">
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse text-red-500 shadow-[0_0_8px_currentColor]" />
                <span className="text-[10px] uppercase font-bold text-white tracking-widest">Preview Mode</span>
              </div>

              <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px] opacity-100">
                {/* Preview the DRAFT config here, not the sfx */}
                <SFXPreview config={editorConfig} className="w-full h-full" />
              </div>
            </div>
          </div>
        ) : (
          // Studio Tab (Presets)
          <SFXPresets currentConfig={sfx} onApply={applyPreset} />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-950 text-[10px] flex justify-between items-center text-zinc-600 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-3 h-3" />
          <span>GPU ACCELERATED ENGINE</span>
        </div>
        <div>v2.1.0 • QUESTBINDER</div>
      </div>
    </div>
  );
};
