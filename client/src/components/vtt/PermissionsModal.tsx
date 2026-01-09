
import React, { useState } from 'react';
import { PermissionSet, SessionPermissions, User, SessionLogConfig, Campaign } from '../../types';
import { Button } from '../ui/Button';
import {
    Shield, MousePointer2, DoorOpen, PenTool, Dices, Save,
    CloudFog, RadioTower, User as UserIcon, Globe, ChevronRight, Check,
    Plus, Trash2, Edit, Ruler, Lock, Eye, EyeOff, ScrollText, Share2, ScanEye, Book, BookOpen, FileText, Sword, Zap, Eraser, ScanFace, MessageSquare, Stars
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { TokenHoverPermissionsCompact } from './TokenHoverPermissionsCompact';
import { useTranslation } from '../../i18n/TranslationContext';

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    permissions: SessionPermissions;
    onUpdate: (perms: Partial<SessionPermissions>) => void;
    campaign: Campaign | null;
    players: User[];
}

type Tab = 'global' | 'players' | 'logs' | 'tokenHover';

const PERM_DEFINITIONS: { key: Exclude<keyof PermissionSet, 'userOverrides' | 'logConfig' | 'shareCursor' | 'allowSpectate'>; icon: React.ReactNode; }[] = [
    // Interaction
    { key: 'tokenMovement', icon: <MousePointer2 className="w-4 h-4" /> },
    { key: 'doorControl', icon: <DoorOpen className="w-4 h-4" /> },

    // Tools & Content
    { key: 'drawings', icon: <PenTool className="w-4 h-4" /> },
    { key: 'drawingDelete', icon: <Trash2 className="w-4 h-4" /> },
    { key: 'drawingClear', icon: <Eraser className="w-4 h-4" /> },
    { key: 'measure', icon: <Ruler className="w-4 h-4" /> },
    { key: 'pingMap', icon: <RadioTower className="w-4 h-4" /> },
    { key: 'diceRolling', icon: <Dices className="w-4 h-4" /> },
    { key: 'initiativeRoll', icon: <Zap className="w-4 h-4" /> },

    // Content Access
    { key: 'compendiumBrowse', icon: <Book className="w-4 h-4" /> },
    { key: 'bestiaryBrowse', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'journalCreate', icon: <FileText className="w-4 h-4" /> },
    { key: 'sheetEdit', icon: <Edit className="w-4 h-4" /> },

    // Manipulation (Advanced)
    { key: 'tokenCreate', icon: <Plus className="w-4 h-4" /> },
    { key: 'tokenEdit', icon: <Edit className="w-4 h-4" /> },
    { key: 'tokenDelete', icon: <Trash2 className="w-4 h-4" /> },

    // Admin
    { key: 'fogReveal', icon: <CloudFog className="w-4 h-4" /> },

    // Cursor Customization
    { key: 'cursorAllowColorChange', icon: <MousePointer2 className="w-4 h-4" /> },
    { key: 'cursorAllowShapeChange', icon: <MousePointer2 className="w-4 h-4" /> },
    { key: 'cursorAllowNameChange', icon: <Edit className="w-4 h-4" /> },
    { key: 'cursorAllowAnimationChange', icon: <Stars className="w-4 h-4" /> },
    { key: 'cursorAllowAnimationColorChange', icon: <Stars className="w-4 h-4" /> },

    // Chat Permissions
    { key: 'chatGlobalAllowed', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'chatPrivateAllowed', icon: <MessageSquare className="w-4 h-4" /> },

    // Visibility
    { key: 'showRemoteViewports', icon: <ScanEye className="w-4 h-4" /> },
    { key: 'shareViewport', icon: <Eye className="w-4 h-4" /> },
];

const PRIVACY_PERMS: { key: 'shareCursor' | 'allowSpectate'; icon: React.ReactNode; }[] = [
    { key: 'shareCursor', icon: <Share2 className="w-4 h-4" /> },
    { key: 'allowSpectate', icon: <ScanEye className="w-4 h-4" /> },
];


export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose, permissions, onUpdate, campaign, players }) => {
    const { t } = useTranslation();
    const [localPerms, setLocalPerms] = useState<SessionPermissions>(permissions);
    const [activeTab, setActiveTab] = useState<Tab>('global');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string; }>({});

    // Local state for tokenHover permissions
    const [localTokenHoverPerms, setLocalTokenHoverPerms] = useState(
        permissions.tokenHover || {
            enabled: true,
            pc: { showName: true, showHP: true, showResource: true, showConditions: true, showStats: true, showAttributes: true },
            npc: { showName: true, showHP: false, showResource: false, showConditions: true, showStats: false, showAttributes: false },
            object: { showName: true, showConditions: false }
        }
    );

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setLocalPerms(permissions);
            setLocalTokenHoverPerms(permissions.tokenHover || {
                enabled: true,
                pc: { showName: true, showHP: true, showResource: true, showConditions: true, showStats: true, showAttributes: true },
                npc: { showName: true, showHP: false, showResource: false, showConditions: true, showStats: false, showAttributes: false },
                object: { showName: true, showConditions: false }
            });
            setActiveTab('global');
            setSelectedPlayerId(null);
        }
    }, [isOpen, permissions]);

    const handleSave = () => {
        onUpdate({ ...localPerms, tokenHover: localTokenHoverPerms });
        onClose();
    };

    const toggleGlobal = (key: keyof PermissionSet) => {
        if (key === 'logConfig' || key === 'userOverrides') return;
        setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleUserOverride = (userId: string, key: keyof PermissionSet) => {
        if (key === 'logConfig' || key === 'userOverrides') return;
        setLocalPerms(prev => {
            const currentOverrides = prev.userOverrides[userId] || {};
            const currentVal = currentOverrides[key];

            // Tri-state logic: Undefined (inherit) -> True (allow) -> False (deny) -> Undefined
            let nextVal: boolean | undefined;
            if (currentVal === undefined) nextVal = true;
            else if (currentVal === true) nextVal = false;
            else nextVal = undefined;

            const newOverrides = { ...currentOverrides, [key]: nextVal };

            // Clean up undefined keys
            if (nextVal === undefined) delete newOverrides[key];

            return {
                ...prev,
                userOverrides: {
                    ...prev.userOverrides,
                    [userId]: newOverrides
                }
            };
        });
    };

    const updateLogConfig = (key: keyof SessionLogConfig, value: 'public' | 'gm') => {
        setLocalPerms(prev => ({
            ...prev,
            logConfig: {
                ...prev.logConfig,
                [key]: value
            }
        }));
    };

    const renderToggle = (
        def: { key: string; icon: React.ReactNode; },
        value: boolean | undefined,
        onClick: () => void,
        isGlobal: boolean
    ) => {
        let statusColor = 'bg-zinc-700';
        let statusText = t('vtt.permissions.modal.status.inherit');

        if (isGlobal) {
            statusColor = value ? 'bg-primary' : 'bg-zinc-700';
        } else {
            if (value === true) { statusColor = 'bg-green-600'; statusText = t('vtt.permissions.modal.status.allowed'); }
            else if (value === false) { statusColor = 'bg-red-600'; statusText = t('vtt.permissions.modal.status.forbidden'); }
            else {
                // Inherit state
                const globalVal = localPerms[def.key as keyof PermissionSet];
                statusText = t('vtt.permissions.modal.status.inheritValue', { value: globalVal ? t('vtt.permissions.modal.status.yes') : t('vtt.permissions.modal.status.no') });
                statusColor = 'bg-zinc-800 border border-zinc-600';
            }
        }

        const label = t(`vtt.permissions.definitions.${def.key}.label` as any);
        const desc = t(`vtt.permissions.definitions.${def.key}.desc` as any);

        return (
            <div
                key={def.key}
                onClick={onClick}
                className={`
                    flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group
                    bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800
                `}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-zinc-200`}>
                        {def.icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-zinc-200">{label}</h4>
                        <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isGlobal && <span className="text-[10px] uppercase font-bold text-zinc-500">{statusText}</span>}
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${statusColor}`}>
                        <div className={`
                            absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm
                            ${isGlobal
                                ? (value ? 'translate-x-5' : 'translate-x-0')
                                : (value === true ? 'translate-x-5' : value === false ? 'translate-x-0' : 'translate-x-2.5 scale-75 opacity-50')
                            }
                        `} />
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('vtt.permissions.modal.title')}
            description={t('vtt.permissions.modal.desc')}
            size="lg"
        >
            <div className="flex h-[600px] gap-0 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">

                {/* SIDEBAR */}
                <div className="w-1/3 border-r border-zinc-800 bg-zinc-900/30 flex flex-col">
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => { setActiveTab('global'); setSelectedPlayerId(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all text-sm font-bold ${activeTab === 'global' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <Globe className="w-4 h-4" /> {t('vtt.permissions.modal.tabs.global')}
                            {activeTab === 'global' && <ChevronRight className="ml-auto w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => { setActiveTab('logs'); setSelectedPlayerId(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all text-sm font-bold ${activeTab === 'logs' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <ScrollText className="w-4 h-4" /> {t('vtt.permissions.modal.tabs.logs')}
                            {activeTab === 'logs' && <ChevronRight className="ml-auto w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => { setActiveTab('tokenHover'); setSelectedPlayerId(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all text-sm font-bold ${activeTab === 'tokenHover' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <ScanFace className="w-4 h-4" /> {t('vtt.permissions.modal.tabs.tokenHover')}
                            {activeTab === 'tokenHover' && <ChevronRight className="ml-auto w-4 h-4" />}
                        </button>
                    </div>

                    <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('vtt.permissions.modal.players.header')}</div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {players.length === 0 && <p className="text-xs text-zinc-600 italic px-2">{t('vtt.permissions.modal.players.empty')}</p>}
                        {players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => { setActiveTab('players'); setSelectedPlayerId(p.id); }}
                                className={`w-full flex items-center gap-3 p-2 rounded-md transition-all text-sm ${selectedPlayerId === p.id ? 'bg-primary/20 text-primary font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                            >
                                <img src={p.avatarUrl} className="w-6 h-6 rounded-full bg-zinc-800" />
                                <span className="truncate">{p.name}</span>
                                {Object.keys(localPerms.userOverrides[p.id] || {}).length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'global' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="mb-2 pb-2 border-b border-zinc-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> {t('vtt.permissions.modal.sections.global.title')}</h3>
                                <p className="text-sm text-zinc-500">{t('vtt.permissions.modal.sections.global.desc')}</p>
                            </div>

                            {/* Visibility Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Eye className="w-3 h-3" /> {t('vtt.permissions.modal.sections.visibility.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['showRemoteViewports', 'shareViewport'].includes(d.key)).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            {/* Interaction Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointer2 className="w-3 h-3" /> {t('vtt.permissions.modal.sections.interaction.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['tokenMovement', 'doorControl'].includes(d.key)).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            {/* Tools Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><PenTool className="w-3 h-3" /> {t('vtt.permissions.modal.sections.tools.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['drawings', 'drawingDelete', 'drawingClear', 'measure', 'pingMap', 'diceRolling', 'initiativeRoll'].includes(d.key)).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            {/* Access Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Book className="w-3 h-3" /> {t('vtt.permissions.modal.sections.access.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['compendiumBrowse', 'bestiaryBrowse', 'journalCreate', 'sheetEdit'].includes(d.key)).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            {/* Creator Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Plus className="w-3 h-3" /> {t('vtt.permissions.modal.sections.manipulation.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['tokenCreate', 'tokenEdit', 'tokenDelete'].includes(d.key)).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            {/* Chat Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MessageSquare className="w-3 h-3" /> {t('vtt.permissions.modal.sections.chat.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['chatGlobalAllowed', 'chatPrivateAllowed'].includes(d.key)).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            {/* Cursor Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointer2 className="w-3 h-3" /> {t('vtt.permissions.modal.sections.cursor.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => d.key.startsWith('cursor')).map(def =>
                                    renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true)
                                )}
                            </div>

                            <div className="pt-4 mt-4 border-t border-zinc-800">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-primary" /> {t('vtt.permissions.modal.sections.privacy.title')}</h3>
                            </div>
                            {PRIVACY_PERMS.map(def => renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true))}
                        </div>
                    )}

                    {activeTab === 'players' && selectedPlayerId && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="mb-2 pb-2 border-b border-zinc-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-primary" />
                                    {players.find(p => p.id === selectedPlayerId)?.name}
                                </h3>
                                <p className="text-sm text-zinc-500">{t('vtt.permissions.modal.sections.overrides.title')}</p>
                            </div>

                            {/* Visibility Section */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Eye className="w-3 h-3" /> {t('vtt.permissions.modal.sections.visibility.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['showRemoteViewports', 'shareViewport'].includes(d.key)).map(def => {
                                    const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                    return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                                })}
                            </div>

                            {/* Other Sections (Grouped simply to avoid code duplication if possible, or just render remaining) */}
                            {/* For players, we can flatten the rest or group them similarly. Let's group for consistency */}

                            {/* Interaction */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointer2 className="w-3 h-3" /> {t('vtt.permissions.modal.sections.interaction.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['tokenMovement', 'doorControl'].includes(d.key)).map(def => {
                                    const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                    return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                                })}
                            </div>

                            {/* Tools */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><PenTool className="w-3 h-3" /> {t('vtt.permissions.modal.sections.tools.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['drawings', 'drawingDelete', 'drawingClear', 'measure', 'pingMap', 'diceRolling', 'initiativeRoll', 'fogReveal'].includes(d.key)).map(def => {
                                    const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                    return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                                })}
                            </div>

                            {/* Content */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Book className="w-3 h-3" /> {t('vtt.permissions.modal.sections.access.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['compendiumBrowse', 'bestiaryBrowse', 'journalCreate', 'sheetEdit', 'tokenCreate', 'tokenEdit', 'tokenDelete'].includes(d.key)).map(def => {
                                    const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                    return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                                })}
                            </div>

                            {/* Chat */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MessageSquare className="w-3 h-3" /> {t('vtt.permissions.modal.sections.chat.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => ['chatGlobalAllowed', 'chatPrivateAllowed'].includes(d.key)).map(def => {
                                    const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                    return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                                })}
                            </div>

                            {/* Cursor */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointer2 className="w-3 h-3" /> {t('vtt.permissions.modal.sections.cursor.title')}</h4>
                                {PERM_DEFINITIONS.filter(d => d.key.startsWith('cursor')).map(def => {
                                    const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                    return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                                })}
                            </div>

                            <div className="pt-4 mt-4 border-t border-zinc-800">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-primary" /> {t('vtt.permissions.modal.status.allowed')}</h3>
                            </div>
                            {PRIVACY_PERMS.map(def => {
                                const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                            })}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="mb-4 pb-2 border-b border-zinc-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> {t('vtt.permissions.modal.sections.logs.title')}</h3>
                                <p className="text-sm text-zinc-500">{t('vtt.permissions.modal.sections.logs.desc')}</p>
                            </div>

                            {[
                                { key: 'movement', label: t('vtt.permissions.modal.logTypes.movement'), icon: <MousePointer2 className="w-4 h-4" /> },
                                { key: 'combat', label: t('vtt.permissions.modal.logTypes.combat'), icon: <Shield className="w-4 h-4" /> },
                                { key: 'rolls', label: t('vtt.permissions.modal.logTypes.rolls'), icon: <Dices className="w-4 h-4" /> },
                                { key: 'system', label: t('vtt.permissions.modal.logTypes.system'), icon: <ScrollText className="w-4 h-4" /> },
                            ].map((item) => {
                                const current = localPerms.logConfig[item.key as keyof SessionLogConfig];
                                const isPublic = current === 'public';
                                return (
                                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-zinc-800 text-zinc-400">{item.icon}</div>
                                            <span className="text-sm font-bold text-zinc-200">{item.label}</span>
                                        </div>
                                        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                                            <button
                                                onClick={() => updateLogConfig(item.key as keyof SessionLogConfig, 'public')}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isPublic ? 'bg-green-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                <Eye className="w-3 h-3" /> {t('vtt.permissions.modal.logVisibility.public')}
                                            </button>
                                            <button
                                                onClick={() => updateLogConfig(item.key as keyof SessionLogConfig, 'gm')}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isPublic ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                <EyeOff className="w-3 h-3" /> {t('vtt.permissions.modal.logVisibility.gm')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Broadcast Conditions Toggle */}
                            <div className="pt-4 mt-4 border-t border-zinc-800">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-primary" /> {t('vtt.permissions.modal.sections.conditions.title')}</h3>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-zinc-800 text-zinc-400"><Sword className="w-4 h-4" /></div>
                                        <div>
                                            <span className="text-sm font-bold text-zinc-200 block">{t('vtt.permissions.modal.sections.conditions.announce')}</span>
                                            <span className="text-xs text-zinc-500">{t('vtt.permissions.modal.sections.conditions.desc')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setLocalPerms(prev => ({ ...prev, logConfig: { ...prev.logConfig, broadcastConditions: !prev.logConfig.broadcastConditions } }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${localPerms.logConfig.broadcastConditions ? 'bg-primary' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${localPerms.logConfig.broadcastConditions ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tokenHover' && campaign && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                            <TokenHoverPermissionsCompact
                                campaign={campaign}
                                permissions={localTokenHoverPerms}
                                onChange={setLocalTokenHoverPerms}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> {t('vtt.permissions.modal.applyButton')}
                </Button>
            </div>
        </Modal>
    );
};

export default PermissionsModal;
