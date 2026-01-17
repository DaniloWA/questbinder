import React, { useState } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Trash2, Save, Download, Play, Plus, Search, AlertCircle, LayoutTemplate, CloudRain, Snowflake, Wind, ArrowLeft } from 'lucide-react';
import { SFXConfig } from '../../types/models';
import { SFXEditor } from './SFXEditor';
import { SFXPreview } from './SFXPreview';

interface SFXPresetsProps {
  currentConfig: SFXConfig;
  onApply: (config: SFXConfig) => void;
}

export const SFXPresets: React.FC<SFXPresetsProps> = ({ currentConfig, onApply }) => {
  const { campaign, saveSFXPreset, deleteSFXPreset } = useGameSession();

  // State
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draftConfig, setDraftConfig] = useState<SFXConfig>(currentConfig);
  const [draftName, setDraftName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const presets = campaign?.sfxPresets || [];

  const handleStartCreate = () => {
    setDraftConfig({ rain: { enabled: false, intensity: 0.5, speed: 1, wind: -50, size: 1, color: '#aabedc' } });
    setDraftName('');
    setIsCreating(true);
    setSelectedPresetId(null);
  };

  const handleSave = () => {
    if (!draftName.trim()) return;
    saveSFXPreset({
      id: Math.random().toString(36).substr(2, 9),
      name: draftName,
      config: draftConfig
    });
    setIsCreating(false);
    // Optionally select the new one, but we don't have its ID easily without return. 
    // We can find it in the list after update usually.
  };

  const handleDeleteInitial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = (id: string) => {
    deleteSFXPreset(id);
    setDeleteConfirmId(null);
    if (selectedPresetId === id) setSelectedPresetId(null);
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);

  return (
    <div className="flex w-full h-full">
      {/* Left Sidebar: List */}
      <div className="w-[200px] flex flex-col border-r border-zinc-800/50 bg-zinc-900/20">
        <div className="p-4 border-b border-zinc-800/50 space-y-3">
          <button
            onClick={handleStartCreate}
            className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl transition-all group ${isCreating ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700 text-zinc-300'}`}
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold text-sm">New Preset</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search library..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:border-indigo-500/50 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {presets.map(preset => (
            <div
              key={preset.id}
              onClick={() => { setIsCreating(false); setSelectedPresetId(preset.id); }}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all border ${selectedPresetId === preset.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-zinc-800/50'}`}
            >
              {deleteConfirmId === preset.id ? (
                <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm rounded-lg flex items-center justify-between px-3 animate-in fade-in zoom-in-95">
                  <span className="text-xs font-bold text-white">Confirm Delete?</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(preset.id); }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase font-bold rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                      className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] uppercase font-bold rounded"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-1.5 rounded-md ${selectedPresetId === preset.id ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                    <LayoutTemplate className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-sm font-medium truncate ${selectedPresetId === preset.id ? 'text-indigo-200' : 'text-zinc-300'}`}>{preset.name}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteInitial(preset.id, e)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Area */}
      <div className="flex-1 flex flex-col bg-zinc-950/50">
        {isCreating ? (
          <div className="flex w-full h-full animate-in fade-in slide-in-from-right-4">
            {/* Left Column: Controls */}
            <div className="w-[450px] flex flex-col border-r border-zinc-800/50 bg-zinc-900/30">
              <div className="p-4 border-b border-zinc-800/50 flex items-center gap-3">
                <button onClick={() => setIsCreating(false)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-zinc-100 font-bold">New SFX Preset</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Preset Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Radioactive Storm"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-zinc-700"
                    autoFocus
                  />
                </div>

                <div className="border-t border-zinc-800/50 pt-4">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-3">Configuration</label>
                  <SFXEditor config={draftConfig} onChange={setDraftConfig} />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <button
                  onClick={handleSave}
                  disabled={!draftName.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Preset
                </button>
              </div>
            </div>

            {/* Right Column: Large Preview */}
            <div className="flex-1 bg-black/40 relative flex flex-col">
              <div className="absolute top-4 right-4 z-10 bg-indigo-600/90 backdrop-blur px-3 py-1.5 rounded-full border border-indigo-400/20 flex items-center gap-2 shadow-xl">
                <span className="text-[10px] uppercase font-bold text-white tracking-widest">Live Editor Preview</span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px]">
                <SFXPreview config={draftConfig} className="w-full h-full" />
              </div>
            </div>
          </div>
        ) : (
          selectedPreset ? (
            <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95">
              <div className="h-1/2 p-6 bg-zinc-900/20 border-b border-zinc-800 relative">
                <div className="h-full rounded-2xl overflow-hidden shadow-2xl shadow-black border border-zinc-700 relative">
                  <SFXPreview config={selectedPreset.config} className="w-full h-full" />

                  <div className="absolute bottom-6 right-6">
                    <button
                      onClick={() => onApply(selectedPreset.config)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Apply to Scene
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedPreset.name}</h2>
                  <div className="flex gap-2 text-xs text-zinc-500 font-mono">
                    <span className="bg-zinc-800 px-2 py-1 rounded">ID: {selectedPreset.id}</span>
                    <span className="bg-zinc-800 px-2 py-1 rounded">CREATED: TODAY</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Configuration Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
                    {selectedPreset.config.rain?.enabled && <div className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-indigo-400" /> Rain Enabled</div>}
                    {selectedPreset.config.snow?.enabled && <div className="flex items-center gap-2"><Snowflake className="w-4 h-4 text-cyan-400" /> Snow Enabled</div>}
                    {selectedPreset.config.fog?.enabled && <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-emerald-400" /> Fog Enabled</div>}
                    {!selectedPreset.config.rain?.enabled && !selectedPreset.config.snow?.enabled && !selectedPreset.config.fog?.enabled && <div className="text-zinc-600 italic">No active effects</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-4">
              <div className="p-6 bg-zinc-900/50 rounded-full border border-zinc-800">
                <LayoutTemplate className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-sm font-medium">Select a preset to view details or create a new one.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
