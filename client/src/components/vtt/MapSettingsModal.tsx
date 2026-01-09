
import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapScene, Playlist, SoundEffect } from '../../types';
import { Button } from '../ui/Button';
import { SheetLabel, SheetInput, SheetSelect, SheetSelectOption } from '../ui/SheetPrimitives';
import { X, UploadCloud, Image as ImageIcon, Eye, EyeOff, ShieldAlert, Sun, Moon, Music, Loader2 } from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';
import { fileService } from '../../services/fileService';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../i18n/TranslationContext';

interface MapSettingsModalProps {
    scene: MapScene;
    onClose: () => void;
    onSave: (newOptions: Partial<MapScene>) => void;
    audioSettings: { playlists: Playlist[], soundboard: SoundEffect[]; };
    // Optional VTT-specific props
    bulkUpdateObstacles?: (updates: any) => void;
    defaultObstacleHidden?: boolean;
    onToggleDefaultObstacleHidden?: () => void;
}

export const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
    scene, onClose, onSave, audioSettings,
    bulkUpdateObstacles, defaultObstacleHidden, onToggleDefaultObstacleHidden
}) => {
    const { t } = useTranslation();
    const { show } = useNotification();
    const [imageUrl, setImageUrl] = useState(scene.imageUrl);
    const [gridSize, setGridSize] = useState(scene.grid.size);
    const [gridCols, setGridCols] = useState(scene.grid.cols);
    const [gridRows, setGridRows] = useState(scene.grid.rows);
    const [gridColor, setGridColor] = useState(scene.grid.color);
    const [gridAlpha, setGridAlpha] = useState(scene.grid.alpha);
    const [unitsPerSquare, setUnitsPerSquare] = useState(scene.grid.unitsPerSquare || 1.5);
    const [ambientLight, setAmbientLight] = useState(scene.ambientLight ?? 1.0);
    const [audioUrl, setAudioUrl] = useState(scene.audioUrl || '');
    const [customAudioUrl, setCustomAudioUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioTracksForSelect: SheetSelectOption[] = useMemo(() => {
        const tracks = audioSettings.playlists.flatMap(p =>
            p.tracks.map(t => ({ label: `${p.name} - ${t.name}`, value: t.url }))
        );
        return [
            { label: t('vtt.maps.settingsModal.audio.noMusic'), value: '' },
            ...tracks,
            { label: t('vtt.maps.settingsModal.audio.customUrl'), value: 'custom' }
        ];
    }, [audioSettings, t]);

    const handleAudioSelectChange = (value: string) => {
        setAudioUrl(value);
        if (value !== 'custom') {
            setCustomAudioUrl('');
        }
    };

    const handleSave = () => {
        onSave({
            imageUrl,
            ambientLight,
            audioUrl: audioUrl === 'custom' ? customAudioUrl : audioUrl,
            grid: {
                ...scene.grid,
                size: gridSize,
                cols: gridCols,
                rows: gridRows,
                color: gridColor,
                alpha: gridAlpha,
                unitsPerSquare: unitsPerSquare,
            }
        });
        onClose();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset states
        setUploadError(null);
        setUploadSuccess(null);
        setIsUploading(true);

        console.log('[MapSettings] Starting upload:', file.name, file.size, file.type);

        try {
            const response = await fileService.upload(file);

            if (response.success && response.data) {
                setImageUrl(response.data);
                setUploadSuccess(response.message || t('vtt.maps.settingsModal.background.image.uploadSuccess'));
                show({ type: 'success', message: t('vtt.maps.settingsModal.background.image.uploadSuccess'), duration: 3000 });

                // Clear success message after 5 seconds
                setTimeout(() => setUploadSuccess(null), 5000);
            } else {
                const errorMsg = response.message || t('vtt.maps.settingsModal.background.image.unknownError');
                setUploadError(errorMsg);
                show({ type: 'error', message: errorMsg, duration: 5000 });
                console.error('[MapSettings] Upload failed:', errorMsg);
            }
        } catch (error) {
            const errorMsg = t('vtt.maps.settingsModal.background.image.error');
            setUploadError(errorMsg);
            show({ type: 'error', message: errorMsg, duration: 5000 });
            console.error('[MapSettings] Upload exception:', error);
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-white">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-bold">{t('vtt.maps.settingsModal.header.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Global Lighting */}
                    <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <SheetLabel icon={<Sun className="w-4 h-4 text-yellow-500" />}>{t('vtt.maps.settingsModal.ambientLight.label')}</SheetLabel>
                            <span className={`text-xs font-bold ${ambientLight === 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                {ambientLight === 0 ? t('vtt.maps.settingsModal.ambientLight.totalDarkness') : `${Math.round(ambientLight * 100)}%`}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Moon className="w-4 h-4 text-zinc-600" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={ambientLight}
                                onChange={(e) => setAmbientLight(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                            <Sun className="w-4 h-4 text-yellow-500" />
                        </div>
                        <p className="text-[10px] text-zinc-500">{t('vtt.maps.settingsModal.ambientLight.desc')}</p>
                    </div>

                    {/* Map Image */}
                    <div className="space-y-2">
                        <SheetLabel icon={<ImageIcon className="w-3 h-3" />}>{t('vtt.maps.settingsModal.background.image.label')}</SheetLabel>

                        {/* Upload Error Display */}
                        {uploadError && (
                            <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 space-y-2">
                                <div className="flex items-start gap-2">
                                    <div className="text-red-400 text-xs whitespace-pre-line flex-1">{uploadError}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setUploadError(null);
                                        fileInputRef.current?.click();
                                    }}
                                    className="text-xs text-red-300 hover:text-red-100 underline"
                                >
                                    {t('vtt.maps.settingsModal.background.image.retry')}
                                </button>
                            </div>
                        )}

                        {/* Upload Success Display */}
                        {uploadSuccess && (
                            <div className="bg-green-950/50 border border-green-800 rounded-lg p-3">
                                <div className="text-green-400 text-xs">{uploadSuccess}</div>
                            </div>
                        )}

                        {/* Upload Progress */}
                        {isUploading && (
                            <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    <span className="text-blue-400 text-xs">{t('vtt.maps.settingsModal.background.image.uploading')}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => {
                                    setImageUrl(e.target.value);
                                    setUploadError(null);
                                    setUploadSuccess(null);
                                }}
                                placeholder={t('vtt.maps.settingsModal.background.image.placeholder')}
                                className="flex-1 h-10 bg-zinc-800 border border-zinc-700 rounded-md px-3 text-sm focus:border-primary focus:ring-primary outline-none"
                                disabled={isUploading}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                title={t('vtt.maps.settingsModal.background.image.uploadTooltip')}
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            </Button>
                        </div>

                        {/* File Info */}
                        {!isUploading && !uploadError && !uploadSuccess && (
                            <p className="text-[10px] text-zinc-500">
                                {t('vtt.maps.settingsModal.background.image.formatsInfo')}
                            </p>
                        )}
                    </div>

                    {/* Background Music */}
                    <div className="space-y-2">
                        <SheetLabel icon={<Music className="w-3 h-3" />}>{t('vtt.maps.settingsModal.audio.label')}</SheetLabel>
                        <SheetSelect
                            value={audioUrl}
                            onChange={handleAudioSelectChange}
                            options={audioTracksForSelect}
                            placeholder={t('vtt.maps.settingsModal.audio.placeholder')}
                            variant="box"
                        />
                        {audioUrl === 'custom' && (
                            <SheetInput
                                value={customAudioUrl}
                                onChange={e => setCustomAudioUrl(e.target.value)}
                                placeholder={t('vtt.maps.settingsModal.audio.customUrlPlaceholder')}
                                variant="box"
                                className="mt-2"
                            />
                        )}
                    </div>

                    {/* Grid Dimensions */}
                    <div className="space-y-2">
                        <SheetLabel>{t('vtt.maps.settingsModal.grid.dimensions.title')}</SheetLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SheetInput label={t('vtt.maps.settingsModal.grid.dimensions.size')} type="number" value={gridSize} onChange={e => setGridSize(Number(e.target.value))} />
                            <SheetInput label={t('vtt.maps.settingsModal.grid.dimensions.cols')} type="number" value={gridCols} onChange={e => setGridCols(Number(e.target.value))} />
                            <SheetInput label={t('vtt.maps.settingsModal.grid.dimensions.rows')} type="number" value={gridRows} onChange={e => setGridRows(Number(e.target.value))} />
                            <SheetInput label={t('vtt.maps.settingsModal.grid.dimensions.units')} type="number" value={unitsPerSquare} onChange={e => setUnitsPerSquare(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Grid Appearance */}
                    <div className="space-y-2">
                        <SheetLabel>{t('vtt.maps.settingsModal.grid.appearance.title')}</SheetLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <SheetLabel>{t('vtt.maps.settingsModal.grid.appearance.color')}</SheetLabel>
                                <ColorPicker value={gridColor} onChange={setGridColor} />
                            </div>
                            <div>
                                <SheetLabel>{t('vtt.maps.settingsModal.grid.appearance.opacity', { percent: Math.round(gridAlpha * 100) })}</SheetLabel>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={gridAlpha}
                                    onChange={(e) => setGridAlpha(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Defaults */}
                    <div className="space-y-2 border-t border-zinc-800 pt-4">
                        <SheetLabel>{t('vtt.maps.settingsModal.defaults.title')}</SheetLabel>
                        {onToggleDefaultObstacleHidden && defaultObstacleHidden !== undefined && (
                            <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-zinc-300">{t('vtt.maps.settingsModal.defaults.hiddenObstacles')}</span>
                                <button
                                    onClick={onToggleDefaultObstacleHidden}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${defaultObstacleHidden ? 'bg-primary' : 'bg-zinc-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${defaultObstacleHidden ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    {bulkUpdateObstacles && (
                        <div className="space-y-2 border-t border-zinc-800 pt-4">
                            <SheetLabel icon={<ShieldAlert className="w-3 h-3" />}>{t('vtt.maps.settingsModal.bulkActions.title')}</SheetLabel>
                            <div className="bg-zinc-800/50 p-3 rounded-lg space-y-3">
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        onClick={() => bulkUpdateObstacles({ hidden: true })}
                                        className="border-dashed border-zinc-600 hover:border-zinc-400 text-zinc-400 hover:text-white"
                                    >
                                        <EyeOff className="w-4 h-4 mr-2" /> {t('vtt.maps.settingsModal.bulkActions.hideAll')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        onClick={() => bulkUpdateObstacles({ hidden: false })}
                                        className="border-dashed border-zinc-600 hover:border-zinc-400 text-zinc-400 hover:text-white"
                                    >
                                        <Eye className="w-4 h-4 mr-2" /> {t('vtt.maps.settingsModal.bulkActions.revealAll')}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-zinc-500 italic text-center">{t('vtt.maps.settingsModal.bulkActions.desc')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 rounded-b-xl">
                    <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave} disabled={isUploading}>
                        {isUploading ? t('vtt.maps.settingsModal.footer.uploading') : t('vtt.maps.settingsModal.footer.saveChanges')}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
