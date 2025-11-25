
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Token, Condition } from '../../types';
import { Edit, Trash2, Eye, EyeOff, Copy, Skull, Droplets, Layers, ChevronRight, ScrollText, Share2, Zap, Activity } from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { STATUS_RULES } from '../../data/rules';

interface TokenContextMenuProps {
    x: number;
    y: number;
    token: Token;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onToggleVisibility: () => void;
    onToggleCondition: (condition: Condition) => void;
    onOpenSheet?: () => void;
}

export const TokenContextMenu: React.FC<TokenContextMenuProps> = ({
    x, y, token, onClose, onEdit, onDuplicate, onDelete, onToggleVisibility, onToggleCondition, onOpenSheet
}) => {
    const { scenes, activeSceneId, moveTokenToScene, isGM, sendChatMessage, permissionHelper } = useGameSession();
    const { user } = useAuth();
    const { show } = useNotification();
    const menuRef = useRef<HTMLDivElement>(null);

    // Submenus
    const [showLayerSubmenu, setShowLayerSubmenu] = useState(false);
    const [showConditionSubmenu, setShowConditionSubmenu] = useState(false);

    // Timer ref para evitar fechamento acidental ao mover o mouse no gap
    const conditionMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // LIVE TOKEN: Fetch the latest token state from context to ensure conditions update in real-time
    // without closing the menu. The `token` prop might be a stale snapshot from when the menu opened.
    const activeScene = scenes.find(s => s.id === activeSceneId);
    const liveToken = activeScene?.tokens.find(t => t.id === token.id) || token;

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [onClose]);

    const style = {
        top: Math.min(y, window.innerHeight - 380),
        left: Math.min(x, window.innerWidth - 250),
    };

    const otherScenes = scenes.filter(s => s.id !== activeSceneId);

    const handleShareToken = () => {
        sendChatMessage(
            `Linkou o token ${liveToken.name} no chat.`,
            'message',
            undefined,
            { type: 'token', label: liveToken.name, id: liveToken.id }
        );
        show({ type: 'success', message: 'Token linkado no chat.' });
        onClose();
    };

    const handleConditionClick = (conditionKey: string) => {
        const def = STATUS_RULES[conditionKey];
        const isActive = liveToken.conditions?.includes(conditionKey);

        onToggleCondition(conditionKey);

        // Se estiver adicionando a condição, enviar regra no chat
        if (!isActive && def) {
            const markdown = `**${def.name}**\n\n${def.effects.map(e => `- ${e}`).join('\n')}\n\n*Duração: ${def.duration}*`;

            sendChatMessage(
                `Aplicou **${def.name}** em ${liveToken.name}.`,
                'system',
                undefined,
                {
                    type: 'compendium',
                    label: def.name,
                    compendiumCategory: 'sections',
                    contentMarkdown: markdown
                }
            );
        }
        // NOTA: Não chamamos onClose() aqui para permitir que o usuário selecione várias condições sem reabrir o menu.
    };

    const handleConditionMouseEnter = () => {
        if (conditionMenuTimeoutRef.current) {
            clearTimeout(conditionMenuTimeoutRef.current);
            conditionMenuTimeoutRef.current = null;
        }
        setShowConditionSubmenu(true);
    };

    const handleConditionMouseLeave = () => {
        // Pequeno delay para permitir que o mouse atravesse o gap entre o botão e o submenu
        conditionMenuTimeoutRef.current = setTimeout(() => {
            setShowConditionSubmenu(false);
        }, 400);
    };

    // Use PermissionHelper for cleaner permission checks
    const canEdit = permissionHelper.canEditToken(liveToken);
    const canCreate = permissionHelper.can('tokenCreate');
    const canDelete = permissionHelper.canDeleteToken(liveToken);

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] w-64 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-2 py-2 mb-1 border-b border-zinc-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 relative">
                    {liveToken.displayMode === 'text' ? (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: liveToken.textDetails?.backgroundColor }}>
                            <span className="font-bold text-xs" style={{ color: liveToken.textDetails?.textColor }}>{liveToken.textDetails?.text}</span>
                        </div>
                    ) : (
                        <img src={liveToken.imgUrl} className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold truncate text-white leading-none">{liveToken.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Tamanho {liveToken.size}x{liveToken.size}</p>
                </div>
            </div>

            <div className="flex flex-col gap-1 mb-1">
                {liveToken.linkedId && onOpenSheet && (
                    <button onClick={() => { onOpenSheet(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-white bg-primary/20 rounded-md hover:bg-primary/30 transition-colors font-bold">
                        <ScrollText className="w-4 h-4" /> Abrir Ficha
                    </button>
                )}

                <button onClick={handleShareToken} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" /> Linkar no Chat
                </button>

                {canEdit && (
                    <button onClick={() => { onEdit(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                        <Edit className="w-4 h-4" /> Editar
                    </button>
                )}

                {canCreate && (
                    <button onClick={() => { onDuplicate(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" /> Duplicar
                    </button>
                )}

                {canEdit && (
                    <button onClick={() => { onToggleVisibility(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                        {liveToken.isVisibleToPlayers ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}
                        {liveToken.isVisibleToPlayers ? 'Visível' : 'Oculto'}
                    </button>
                )}



                {isGM && otherScenes.length > 0 && (
                    <div
                        className="relative group"
                    >
                        <button className="flex items-center justify-between w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                                <Layers className="w-4 h-4" /> Enviar para Cena
                            </div>
                            <ChevronRight className="w-3 h-3 opacity-50" />
                        </button>

                        <div className="hidden group-hover:block absolute left-full top-0 ml-1 w-48 bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto custom-scrollbar z-[10000]">
                            <div className="absolute right-full top-0 h-full w-4 bg-transparent" />
                            <div className="px-2 py-1 mb-1 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Selecione o Destino</div>
                            {otherScenes.map(scene => (
                                <button
                                    key={scene.id}
                                    onClick={() => { moveTokenToScene(liveToken.id, scene.id); onClose(); }}
                                    className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 rounded hover:bg-primary/20 hover:text-white truncate transition-colors"
                                >
                                    {scene.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-zinc-800 my-1 mx-2" />

            {canDelete && (
                <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" /> Remover Token
                </button>
            )}
        </div>,
        document.body
    );
};
