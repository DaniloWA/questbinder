import { useTranslation } from '../../i18n/TranslationContext';

import React, { useState } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { MapScene } from '../../types';
import { Layers, Plus, ChevronUp, ChevronDown, MoreVertical, Trash2, Edit, Map as MapIcon } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useModal } from '../../context/ModalContext';
import { Button } from '../ui/Button';

export const SceneNavigation: React.FC = () => {
    const { t } = useTranslation();
    const { scenes, activeSceneId, switchScene, addScene, deleteScene, isGM, updateSceneData } = useGameSession();
    const { openModal, closeModal } = useModal();
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    if (!isGM) {
        // Players only see active scene info, or nothing if they shouldn't know about layers
        return null;
    }

    const handleAddScene = () => {
        const name = `${t('vtt.scene.navigation.newScene.defaultName')} ${scenes.length + 1}`;
        addScene(name);
    };

    const startEditing = (scene: MapScene) => {
        setIsEditing(scene.id);
        setEditName(scene.name);
    };

    const saveEdit = (id: string) => {
        if (editName.trim()) {
            updateSceneData(id, { name: editName });
        }
        setIsEditing(null);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        openModal(
            <div className="space-y-4">
                <p>{t('vtt.scene.navigation.temCertezaQue.text')}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={closeModal}>{t('vtt.scene.navigation.cancelar.label')}</Button>
                    <Button variant="destructive" onClick={() => {
                        deleteScene(id);
                        closeModal();
                    }}>{t('vtt.scene.navigation.excluirCamada.text')}</Button>
                </div>
            </div>,
            { title: t('vtt.scene.navigation.excluirCamada.title'), variant: 'alert' }
        );
    };

    return (
        <div className="absolute bottom-6 left-6 z-30 flex flex-col items-start gap-2">
            <div
                className={`
                    bg-zinc-950/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl 
                    transition-all duration-300 origin-bottom-left overflow-hidden
                    ${isOpen ? 'w-64 max-h-[400px] opacity-100' : 'w-12 max-h-0 opacity-0 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3 h-3" />{t('vtt.scene.navigation.camadas.label')}</span>
                    <button onClick={handleAddScene} className="p-1 hover:bg-primary/20 hover:text-primary rounded text-zinc-400 transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* List */}
                <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar max-h-[300px]">
                    {scenes.map(scene => {
                        const isActive = scene.id === activeSceneId;
                        return (
                            <div
                                key={scene.id}
                                onClick={() => switchScene(scene.id)}
                                className={`
                                    group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border
                                    ${isActive
                                        ? 'bg-primary/10 border-primary/30 text-white'
                                        : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                    }
                                `}
                            >
                                {/* Thumbnail / Icon */}
                                <div className={`w-8 h-8 rounded overflow-hidden shrink-0 border ${isActive ? 'border-primary/50' : 'border-zinc-800'}`}>
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                            <MapIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    {isEditing === scene.id ? (
                                        <input
                                            autoFocus
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onBlur={() => saveEdit(scene.id)}
                                            onKeyDown={e => e.key === 'Enter' && saveEdit(scene.id)}
                                            onClick={e => e.stopPropagation()}
                                            className="w-full bg-zinc-950 border border-primary/50 rounded px-1 py-0.5 text-xs outline-none text-white"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold truncate">{scene.name}</p>
                                    )}
                                    <p className="text-[10px] opacity-50">{scene.tokens.length} {t('vtt.scene.navigation.tokens.label')}</p>
                                </div>

                                {/* Actions */}
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); startEditing(scene); }} className="p-1 hover:text-white"><Edit className="w-3 h-3" /></button>
                                    {scenes.length > 1 && (
                                        <button onClick={(e) => handleDelete(e, scene.id)} className="p-1 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toggle Button */}
            <Tooltip content={t('vtt.scene.navigation.gerenciarCenasandares.tooltip')} position="right">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        h-12 w-12 rounded-xl shadow-xl border flex items-center justify-center transition-all
                        ${isOpen
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-950/80 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                        }
                    `}
                >
                    <Layers className="w-6 h-6" />
                    {scenes.length > 1 && !isOpen && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-zinc-950">
                            {scenes.length}
                        </div>
                    )}
                </button>
            </Tooltip>
        </div>
    );
};
