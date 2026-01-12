import React, { useState, useEffect, useRef } from 'react';
import { GameRole } from '../../types/acl';
import { useTranslation } from '../../i18n/TranslationContext';
import { AccessGate } from '../AccessGate';
import { useAccessControl } from '../../hooks/useAccessControl';
import { createPortal } from 'react-dom';
import { Token, Condition } from '../../types';
import { Edit, Trash2, Eye, EyeOff, Copy, Layers, ChevronRight, ScrollText, Share2 } from 'lucide-react';
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
    const { t, hasKey } = useTranslation();
    const { permissions, campaign } = useGameSession();
    const { scenes, activeSceneId, moveTokenToScene, sendChatMessage, permissionHelper } = useGameSession();
    const { isGM } = useAccessControl();
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
            t('vtt.tokens.contextMenu.shareTokenNotify', { name: liveToken.name }),
            'message',
            undefined,
            { type: 'token', label: liveToken.name, id: liveToken.id }
        );
        show({ type: 'success', message: t('vtt.tokens.contextMenu.linkTokenNotify') });
        onClose();
    };

    const handleConditionClick = (conditionId: string) => {
        const def = STATUS_RULES[conditionId];
        const isActive = liveToken.conditions?.includes(conditionId as Condition);

        onToggleCondition(conditionId as Condition);

        // Se estiver adicionando a condição, enviar regra no chat
        if (!isActive && def) {
            const name = hasKey(`dnd.rules.conditions.${conditionId}.name`) ? t(`dnd.rules.conditions.${conditionId}.name`) : def.name;
            const effectsTransl = def.effects.map((_, i) => {
                const key = `dnd.rules.conditions.${conditionId}.effects.${i}`;
                return hasKey(key) ? t(key) : def.effects[i];
            });
            const durationTransl = hasKey(`dnd.rules.conditions.${conditionId}.duration`) ? t(`dnd.rules.conditions.${conditionId}.duration`) : def.duration;

            const markdown = `**${name}**\n\n${effectsTransl.map(e => `- ${e}`).join('\n')}\n\n*${t('common.duration')}: ${durationTransl}*`;

            sendChatMessage(
                t('vtt.tokens.editModal.hover.applyCondition', { condition: name, name: liveToken.name }),
                'system',
                undefined,
                {
                    type: 'compendium',
                    label: name,
                    compendiumCategory: 'sections',
                    contentMarkdown: markdown
                }
            );
        }
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
                    <p className="text-[10px] text-zinc-400 mt-0.5">{t('vtt.tokens.contextMenu.size', { size: liveToken.size })}</p>
                </div>
            </div>

            <div className="flex flex-col gap-1 mb-1">
                {liveToken.linkedId && onOpenSheet && (
                    <button onClick={() => { onOpenSheet(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-white bg-primary/20 rounded-md hover:bg-primary/30 transition-colors font-bold">
                        <ScrollText className="w-4 h-4" /> {t('vtt.tokens.contextMenu.openSheet')}
                    </button>
                )}

                <button onClick={handleShareToken} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" /> {t('vtt.tokens.contextMenu.shareToken')}
                </button>

                {canEdit && (
                    <button onClick={() => { onEdit(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                        <Edit className="w-4 h-4" /> {t('vtt.tokens.contextMenu.edit')}
                    </button>
                )}

                <AccessGate requirePermission="tokenCreate">
                    <button onClick={() => { onDuplicate(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" /> {t('vtt.tokens.contextMenu.duplicate')}
                    </button>
                </AccessGate>

                {canEdit && (
                    <button onClick={() => { onToggleVisibility(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                        {liveToken.isVisibleToPlayers ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}
                        {liveToken.isVisibleToPlayers ? t('vtt.tokens.contextMenu.visible') : t('vtt.tokens.contextMenu.hidden')}
                    </button>
                )}

                <AccessGate requireRole={GameRole.GM}>
                    {otherScenes.length > 0 && (
                        <div className="relative group">
                            <button className="flex items-center justify-between w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors">
                                <div className="flex items-center gap-3">
                                    <Layers className="w-4 h-4" /> {t('vtt.tokens.contextMenu.sendToScene')}
                                </div>
                                <ChevronRight className="w-3 h-3 opacity-50" />
                            </button>

                            <div className="hidden group-hover:block absolute left-full top-0 ml-1 w-48 bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto custom-scrollbar z-[10000]">
                                <div className="absolute right-full top-0 h-full w-4 bg-transparent" />
                                <div className="px-2 py-1 mb-1 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">{t('vtt.tokens.contextMenu.selectDestination')}</div>
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
                </AccessGate>
            </div>

            <div className="h-px bg-zinc-800 my-1 mx-2" />

            <AccessGate requirePermission="tokenDelete">
                {/* Note: we still check canDeleteToken logic inside? or assume AccessGate handles general permission? 
                 canDeleteToken includes "control" check. AccessGate is just raw permission.
                 For token deletion, we NEED ownership check. 
                 So AccessGate wraps the raw permission, but we might still need the logic.
                 Wait, AccessGate only checks if I have 'tokenDelete' permission globally.
                 It does NOT check if I own THIS token.
                 So replacing 'canDelete' (which calls helper.canDeleteToken) with AccessGate("tokenDelete") is WRONG for players deleting their own tokens.
                 
                 Actually, players deleting their own tokens requires 'tokenDelete' permission? No, typically owners can delete?
                 Let's check PermissionHelper.js: 
                 canDeleteToken(token) => isGM || (canControlToken(token) && can('tokenDelete'))
                 
                 So they NEED 'tokenDelete'.
                 Use AccessGate with a custom condition? Or keep manual check?
                 The user asked for AccessGuard.
                 AccessGate handles boolean permissions.
                 If I strictly use AccessGate, I lose the "Control" check context.
                 
                 I should stick to the manual check for Token Specific Actions OR update AccessGate to handle "Context".
                 AccessGate doesn't handle context.
                 
                 So I will only use AccessGate for 'tokenCreate' (Duplicate) which is global.
                 For Delete/Edit, specific token context matters.
                 
                 I will keep the manual checks for Edit/Delete but ensure they use helper.
                 I already audited them and they use helper.canDeleteToken.
                 
                 I will just wrap 'Duplicate' (tokenCreate) with AccessGate to show compliance.
            */}
                {canDelete && (
                    <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors">
                        <Trash2 className="w-4 h-4" /> {t('vtt.tokens.contextMenu.remove')}
                    </button>
                )}
            </AccessGate>
        </div>,
        document.body
    );
};
