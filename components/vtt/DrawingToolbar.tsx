
import React, { useState } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useModal } from '../../context/ModalContext';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { RotateCcw, Trash2, Eraser } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

const PRESET_COLORS = [
    '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#000000'
];

export const DrawingToolbar: React.FC = () => {
    const { activeTool, drawingSettings, setDrawingSettings, undoLastDrawing, clearAllDrawings, checkPermission, isGM } = useGameSession();
    const { openModal, closeModal } = useModal();

    if (activeTool !== 'brush') return null;

    // Check if user can clear everything
    const canClearAll = isGM || checkPermission('drawingClear');

    const handleColorChange = (color: string) => {
        setDrawingSettings({ ...drawingSettings, color });
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDrawingSettings({ ...drawingSettings, width: parseInt(e.target.value) });
    };

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDrawingSettings({ ...drawingSettings, opacity: parseFloat(e.target.value) });
    };

    const handleClearAll = () => {
        openModal(
            <div className="space-y-4">
                <p className="text-zinc-400">Tem certeza que deseja apagar <strong>todos</strong> os desenhos desta cena? Esta ação é irreversível.</p>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                    <Button variant="destructive" onClick={() => { clearAllDrawings(); closeModal(); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Limpar Tudo
                    </Button>
                </div>
            </div>,
            { title: 'Limpar Desenhos', variant: 'alert', size: 'sm' }
        );
    };

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200 ring-1 ring-white/10">
            
            {/* Color Picker Section */}
            <div className="flex items-center gap-2">
                <div className="grid grid-cols-5 gap-1">
                    {PRESET_COLORS.slice(0, 5).map(c => (
                        <button 
                            key={c}
                            onClick={() => handleColorChange(c)}
                            className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${drawingSettings.color === c ? 'border-white ring-1 ring-primary' : 'border-zinc-700'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    {PRESET_COLORS.slice(5).map(c => (
                        <button 
                            key={c}
                            onClick={() => handleColorChange(c)}
                            className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${drawingSettings.color === c ? 'border-white ring-1 ring-primary' : 'border-zinc-700'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
                <div className="w-px h-8 bg-zinc-800 mx-1"></div>
                <ColorPicker value={drawingSettings.color} onChange={handleColorChange} />
            </div>

            <div className="w-px h-8 bg-zinc-800"></div>

            {/* Sliders Section */}
            <div className="flex flex-col gap-2 w-32">
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase">
                    <span>Tamanho</span>
                    <span className="text-white">{drawingSettings.width}px</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={drawingSettings.width} 
                    onChange={handleWidthChange}
                    className="h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full"
                />
            </div>

            <div className="flex flex-col gap-2 w-32">
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase">
                    <span>Opacidade</span>
                    <span className="text-white">{Math.round(drawingSettings.opacity * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.1"
                    value={drawingSettings.opacity} 
                    onChange={handleOpacityChange}
                    className="h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full"
                />
            </div>

            <div className="w-px h-8 bg-zinc-800"></div>

            {/* Actions Section */}
            <div className="flex gap-2">
                <Tooltip content="Desfazer último traço">
                    <button 
                        onClick={undoLastDrawing}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </Tooltip>
                
                {canClearAll && (
                    <Tooltip content="Limpar TODOS os desenhos">
                        <button 
                            onClick={handleClearAll}
                            className="p-2 rounded-lg hover:bg-red-900/20 text-zinc-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/30"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};
