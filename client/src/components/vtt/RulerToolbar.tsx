
import React from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Magnet, Grid, Move, LayoutGrid, Info } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { SheetSelect } from '../ui/SheetPrimitives';
import { MeasurementMetric } from '../../types';

export const RulerToolbar: React.FC = () => {
    const { activeTool, rulerSettings, setRulerSettings } = useGameSession();

    if (activeTool !== 'measure-path') return null;

    const handleSnapToggle = () => {
        setRulerSettings({ ...rulerSettings, snapToGrid: !rulerSettings.snapToGrid });
    };

    const handleMetricChange = (metric: string) => {
        setRulerSettings({ ...rulerSettings, metric: metric as MeasurementMetric });
    };

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-2 px-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200 ring-1 ring-white/10">
            
            <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">Modo</span>
                <Tooltip content={rulerSettings.snapToGrid ? "Grudar na Grade" : "Medição Livre"}>
                    <button 
                        onClick={handleSnapToggle}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rulerSettings.snapToGrid ? 'bg-primary text-white shadow-sm' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {rulerSettings.snapToGrid ? <Magnet className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
                        {rulerSettings.snapToGrid ? 'Snap On' : 'Livre'}
                    </button>
                </Tooltip>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">Métrica</span>
                <div className="w-40">
                    <SheetSelect 
                        value={rulerSettings.metric} 
                        onChange={handleMetricChange} 
                        options={[
                            { label: 'Euclidiana (Real)', value: 'euclidean' },
                            { label: 'D&D 5e / Célula', value: 'chebyshev' },
                            { label: 'Manhattan (Reto)', value: 'manhattan' }
                        ]}
                        variant="box"
                        className="text-xs h-8 bg-zinc-900 border-zinc-700"
                    />
                </div>
                <Tooltip content="Define como a distância diagonal é calculada.">
                    <div className="text-zinc-600 cursor-help">
                        <Info className="w-3.5 h-3.5" />
                    </div>
                </Tooltip>
            </div>
        </div>
    );
};
