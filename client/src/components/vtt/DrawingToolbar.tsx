
import React, { useState } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useModal } from '../../context/ModalContext';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { RotateCcw, Trash2, Eraser, Sparkles, Eye } from 'lucide-react';
import { SmartWallPreviewModal } from './SmartWallPreviewModal';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n/TranslationContext';
import { AccessGate } from '../AccessGate';

const PRESET_COLORS = [
    '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#000000'
];

export const DrawingToolbar: React.FC = () => {
    const { activeTool, drawingSettings, wandSettings, setDrawingSettings, setWandSettings, undoLastDrawing, clearAllDrawings, undoLastObstacle, clearAllObstacles, permissionHelper } = useGameSession();
    const { openModal, closeModal } = useModal();
    const { t } = useTranslation();

    if (activeTool !== 'brush' && activeTool !== 'smart-wall') return null;

    // REGRA MILENAR: Use PermissionHelper
    const canClearAll = permissionHelper.canAsGMOr('drawingClear');

    const handleColorChange = (color: string) => {
        setDrawingSettings({ ...drawingSettings, color });
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDrawingSettings({ ...drawingSettings, width: parseInt(e.target.value) });
    };

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDrawingSettings({ ...drawingSettings, opacity: parseFloat(e.target.value) });
    };

    const handleWandToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWandSettings({ ...wandSettings, tolerance: parseInt(e.target.value) });
    };

    const handleWandSimplificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWandSettings({ ...wandSettings, simplification: parseFloat(e.target.value) });
    };

    const handleWandResolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        if (newValue > wandSettings.resolution && newValue > 512) {
            openModal(
                <div className="space-y-4">
                    <p className="text-zinc-400">{t('vtt.smartWall.warning.description')}</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={closeModal}>{t('vtt.smartWall.warning.cancel')}</Button>
                        <Button variant="primary" onClick={() => { setWandSettings({ ...wandSettings, resolution: newValue }); closeModal(); }}>
                            {t('vtt.smartWall.warning.continue')}
                        </Button>
                    </div>
                </div>,
                { title: t('vtt.smartWall.warning.title'), variant: 'alert', size: 'sm' }
            );
        } else {
            setWandSettings({ ...wandSettings, resolution: newValue });
        }
    };

    const handleSmoothingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            openModal(
                <div className="space-y-4">
                    <p className="text-zinc-400">{t('vtt.smartWall.warning.description')}</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={closeModal}>{t('vtt.smartWall.warning.cancel')}</Button>
                        <Button variant="primary" onClick={() => { setWandSettings({ ...wandSettings, smoothing: true }); closeModal(); }}>
                            {t('vtt.smartWall.warning.continue')}
                        </Button>
                    </div>
                </div>,
                { title: t('vtt.smartWall.warning.title'), variant: 'alert', size: 'sm' }
            );
        } else {
            setWandSettings({ ...wandSettings, smoothing: false });
        }
    };

    const handleClearAll = () => {
        const isSmartWall = activeTool === 'smart-wall';
        const typeLabel = isSmartWall ? t('vtt.drawing.toolbar.paredesDinmicas.text') : t('vtt.drawing.toolbar.desenhos.label');
        const action = isSmartWall ? clearAllObstacles : clearAllDrawings;

        openModal(
            <div className="space-y-4">
                <p className="text-zinc-400">{t('vtt.drawing.toolbar.temCertezaQue.text')} <strong>{t('vtt.drawing.toolbar.todos.label')}</strong> os {typeLabel} {t('vtt.drawing.toolbar.destaCenaEsta.text')}</p>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={closeModal}>{t('vtt.drawing.toolbar.cancelar.label')}</Button>
                    <Button variant="destructive" onClick={() => { action(); closeModal(); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> {t('vtt.drawing.toolbar.limparTudo.text')}
                    </Button>
                </div>
            </div>,
            { title: isSmartWall ? t('vtt.drawing.toolbar.limparParedes.title') : t('vtt.drawing.toolbar.limparDesenhos.title'), variant: 'alert', size: 'sm' }
        );
    };

    return (
        <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-2 sm:p-3 shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200 ring-1 ring-white/10 max-w-[95vw]">
            {activeTool === 'brush' && (
                <>
                    {/* Color Picker Section */}
                    <div className="flex items-center gap-2">
                        <div className="grid grid-cols-5 gap-1">
                            {PRESET_COLORS.slice(0, 5).map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleColorChange(c)}
                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border transition-transform hover:scale-110 ${drawingSettings.color === c ? 'border-white ring-1 ring-primary' : 'border-zinc-700'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            {PRESET_COLORS.slice(5).map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleColorChange(c)}
                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border transition-transform hover:scale-110 ${drawingSettings.color === c ? 'border-white ring-1 ring-primary' : 'border-zinc-700'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="w-px h-8 bg-zinc-800 mx-1 hidden sm:block"></div>
                        <ColorPicker value={drawingSettings.color} onChange={handleColorChange} />
                    </div>

                    <div className="w-px h-6 sm:h-8 bg-zinc-800 hidden sm:block"></div>

                    {/* Sliders Section - Stacked on super small screens, side-by-side on larger */}
                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col gap-1 w-24 sm:w-32">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>{t('vtt.drawing.toolbar.tamanho.label')}</span>
                                <span className="text-white">{drawingSettings.width}px</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={drawingSettings.width}
                                onChange={handleWidthChange}
                                className="h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full touch-none"
                            />
                        </div>

                        <div className="flex flex-col gap-1 w-24 sm:w-32">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>{t('vtt.drawing.toolbar.opacidade.label')}</span>
                                <span className="text-white">{Math.round(drawingSettings.opacity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={drawingSettings.opacity}
                                onChange={handleOpacityChange}
                                className="h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full touch-none"
                            />
                        </div>
                    </div>
                </>
            )}

            {activeTool === 'smart-wall' && (
                <>
                    <div className="flex items-center gap-2 px-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col hidden sm:flex">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none">{t('vtt.drawing.toolbar.smartWall.text')}</span>
                            <span className="text-[9px] text-zinc-500 italic mt-0.5">{t('vtt.drawing.toolbar.configuraesDaVarinha.text')}</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-zinc-800 hidden sm:block"></div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center">
                        {/* Tolerance */}
                        <div className="flex flex-col gap-1 w-24 sm:w-28">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>{t('vtt.drawing.toolbar.tolerncia.label')}</span>
                                <span className="text-white font-mono">{wandSettings.tolerance}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="255"
                                value={wandSettings.tolerance}
                                onChange={handleWandToleranceChange}
                                className="h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full touch-none"
                            />
                        </div>

                        {/* Simplification */}
                        <div className="flex flex-col gap-1 w-24 sm:w-28">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>{t('vtt.drawing.toolbar.simplificao.label')}</span>
                                <span className="text-white font-mono">{wandSettings.simplification.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={wandSettings.simplification}
                                onChange={handleWandSimplificationChange}
                                className="h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full touch-none"
                            />
                        </div>

                        {/* Resolution */}
                        <div className="flex flex-col gap-1 w-24 sm:w-28">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>{t('vtt.drawing.toolbar.resoluo.label')}</span>
                                <span className="text-white font-mono">{wandSettings.resolution}px</span>
                            </div>
                            <input
                                type="range"
                                min="128"
                                max="4096"
                                step="64"
                                value={wandSettings.resolution}
                                onChange={handleWandResolutionChange}
                                className="h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full touch-none"
                            />
                        </div>

                        {/* Smoothing */}
                        <div className="flex flex-col gap-1 w-24 sm:w-28">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>Smoothing</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-mono text-[9px]">{wandSettings.smoothing ? 'ON' : 'OFF'}</span>
                                    <input
                                        type="checkbox"
                                        checked={wandSettings.smoothing}
                                        onChange={handleSmoothingChange}
                                        className="accent-primary w-3 h-3 cursor-pointer"
                                    />
                                </div>
                            </div>
                            {wandSettings.smoothing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={wandSettings.smoothingIterations}
                                        onChange={(e) => setWandSettings({ ...wandSettings, smoothingIterations: parseInt(e.target.value) })}
                                        className="h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary w-full touch-none"
                                    />
                                    <span className="text-xs text-white w-3">{wandSettings.smoothingIterations}</span>
                                </div>
                            ) : (
                                <div className="h-4"></div> // Spacer to keep alignment
                            )}
                        </div>

                        <div className="flex flex-col gap-1 items-center px-1">
                            <button
                                onClick={() => openModal(<SmartWallPreviewModal wandSettings={wandSettings} setWandSettings={setWandSettings} />, { title: t('vtt.drawing.toolbar.sandboxDoSmart.label'), size: 'lg' })}
                                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all group shadow-lg shadow-primary/5 hover:scale-110 active:scale-95 border border-primary/20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <span className="text-[8px] font-bold text-primary uppercase tracking-tighter hidden sm:block">{t('vtt.drawing.toolbar.preview.label')}</span>
                        </div>
                    </div>
                </>
            )}

            <div className="w-px h-8 bg-zinc-800 hidden sm:block"></div>

            {/* Actions Section */}
            <div className="flex gap-2">
                <Tooltip content={activeTool === 'smart-wall' ? t('vtt.drawing.toolbar.desfazerLtimaParede.tooltip') : t('vtt.drawing.toolbar.desfazerLtimoTrao.tooltip')}>
                    <button
                        onClick={activeTool === 'smart-wall' ? undoLastObstacle : undoLastDrawing}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </Tooltip>

                <AccessGate requirePermission="drawingClear">
                    <Tooltip content={t('vtt.drawing.toolbar.limparTodosOs.tooltip')}>
                        <button
                            onClick={handleClearAll}
                            className="p-2 rounded-lg hover:bg-red-900/20 text-zinc-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/30"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </AccessGate>
            </div>
        </div>
    );
};
