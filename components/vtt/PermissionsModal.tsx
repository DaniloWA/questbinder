
import React, { useState } from 'react';
import { PermissionSet, SessionPermissions, User, SessionLogConfig, Campaign } from '../../types';
import { Button } from '../ui/Button';
import {
    Shield, MousePointer2, DoorOpen, PenTool, Dices, Save,
    CloudFog, RadioTower, User as UserIcon, Globe, ChevronRight, Check,
    Plus, Trash2, Edit, Ruler, Lock, Eye, EyeOff, ScrollText, Share2, ScanEye, Book, FileText, Sword, Zap, Eraser, ScanFace
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { TokenHoverPermissionsPanel } from '../CampaignSettings/TokenHoverPermissionsPanel';

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    permissions: SessionPermissions;
    onUpdate: (perms: Partial<SessionPermissions>) => void;
    campaign: Campaign | null;
    players: User[];
}

type Tab = 'global' | 'players' | 'logs' | 'tokenHover';

const PERM_DEFINITIONS: { key: Exclude<keyof PermissionSet, 'userOverrides' | 'logConfig' | 'shareCursor' | 'allowSpectate'>; label: string; desc: string; icon: React.ReactNode; }[] = [
    // Interaction
    { key: 'tokenMovement', label: 'Mover Tokens', desc: 'Mover tokens que eles controlam.', icon: <MousePointer2 className="w-4 h-4" /> },
    { key: 'doorControl', label: 'Usar Portas', desc: 'Abrir/fechar portas e janelas.', icon: <DoorOpen className="w-4 h-4" /> },

    // Tools & Content
    { key: 'drawings', label: 'Desenhar', desc: 'Desenhar no mapa.', icon: <PenTool className="w-4 h-4" /> },
    { key: 'drawingDelete', label: 'Apagar (Seus)', desc: 'Apagar desenhos próprios.', icon: <Trash2 className="w-4 h-4" /> },
    { key: 'drawingClear', label: 'Limpar Tudo', desc: 'Apagar todos os desenhos da camada.', icon: <Eraser className="w-4 h-4" /> },
    { key: 'measure', label: 'Régua', desc: 'Usar ferramenta de medição.', icon: <Ruler className="w-4 h-4" /> },
    { key: 'pingMap', label: 'Ping no Mapa', desc: 'Sinalizar locais para o grupo.', icon: <RadioTower className="w-4 h-4" /> },
    { key: 'diceRolling', label: 'Rolagem de Dados', desc: 'Usar o rola-dados digital.', icon: <Dices className="w-4 h-4" /> },
    { key: 'initiativeRoll', label: 'Rolar Iniciativa', desc: 'Jogadores rolam própria iniciativa.', icon: <Zap className="w-4 h-4" /> },

    // Content Access
    { key: 'compendiumBrowse', label: 'Acessar Grimório', desc: 'Consultar monstros/magias/regras.', icon: <Book className="w-4 h-4" /> },
    { key: 'journalCreate', label: 'Criar Notas', desc: 'Criar handouts/recursos.', icon: <FileText className="w-4 h-4" /> },
    { key: 'sheetEdit', label: 'Editar Ficha', desc: 'Modificar valores da ficha de personagem.', icon: <Edit className="w-4 h-4" /> },

    // Manipulation (Advanced)
    { key: 'tokenCreate', label: 'Criar Tokens', desc: 'Adicionar novos tokens ao mapa.', icon: <Plus className="w-4 h-4" /> },
    { key: 'tokenEdit', label: 'Editar Tokens', desc: 'Alterar status e aparência de tokens.', icon: <Edit className="w-4 h-4" /> },
    { key: 'tokenDelete', label: 'Deletar Tokens', desc: 'Remover tokens do mapa.', icon: <Trash2 className="w-4 h-4" /> },

    // Admin
    { key: 'fogReveal', label: 'Revelar Neblina', desc: 'Remover neblina de guerra manualmente.', icon: <CloudFog className="w-4 h-4" /> },
];

const PRIVACY_PERMS: { key: 'shareCursor' | 'allowSpectate'; label: string; desc: string; icon: React.ReactNode; }[] = [
    { key: 'shareCursor', label: 'Compartilhar Ponteiro', desc: 'Permitir que o cursor do jogador seja visto por outros.', icon: <Share2 className="w-4 h-4" /> },
    { key: 'allowSpectate', label: 'Permitir Espectador', desc: 'Permitir que o Mestre veja a tela deste jogador.', icon: <ScanEye className="w-4 h-4" /> },
];


export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose, permissions, onUpdate, campaign, players }) => {
    const [localPerms, setLocalPerms] = useState<SessionPermissions>(permissions);
    const [activeTab, setActiveTab] = useState<Tab>('global');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setLocalPerms(permissions);
            setActiveTab('global');
            setSelectedPlayerId(null);
        }
    }, [isOpen, permissions]);

    const handleSave = () => {
        onUpdate(localPerms);
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
        def: { key: string; label: string; desc: string; icon: React.ReactNode; },
        value: boolean | undefined,
        onClick: () => void,
        isGlobal: boolean
    ) => {
        let statusColor = 'bg-zinc-700';
        let statusText = 'Herdar Global';

        if (isGlobal) {
            statusColor = value ? 'bg-primary' : 'bg-zinc-700';
        } else {
            if (value === true) { statusColor = 'bg-green-600'; statusText = 'Permitido'; }
            else if (value === false) { statusColor = 'bg-red-600'; statusText = 'Proibido'; }
            else {
                // Inherit state
                const globalVal = localPerms[def.key as keyof PermissionSet];
                statusText = `Herdar (${globalVal ? 'Sim' : 'Não'})`;
                statusColor = 'bg-zinc-800 border border-zinc-600';
            }
        }

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
                        <h4 className="font-bold text-sm text-zinc-200">{def.label}</h4>
                        <p className="text-xs text-zinc-500">{def.desc}</p>
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
            title="Permissões da Sessão"
            description="Controle granular do que os jogadores podem fazer."
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
                            <Globe className="w-4 h-4" /> Global
                            {activeTab === 'global' && <ChevronRight className="ml-auto w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => { setActiveTab('logs'); setSelectedPlayerId(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all text-sm font-bold ${activeTab === 'logs' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <ScrollText className="w-4 h-4" /> Logs & Visibilidade
                            {activeTab === 'logs' && <ChevronRight className="ml-auto w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => { setActiveTab('tokenHover'); setSelectedPlayerId(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all text-sm font-bold ${activeTab === 'tokenHover' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <ScanFace className="w-4 h-4" /> Token Hover
                            {activeTab === 'tokenHover' && <ChevronRight className="ml-auto w-4 h-4" />}
                        </button>
                    </div>

                    <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogadores</div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {players.length === 0 && <p className="text-xs text-zinc-600 italic px-2">Nenhum jogador conectado.</p>}
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
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="mb-4 pb-2 border-b border-zinc-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Regras Globais</h3>
                                <p className="text-sm text-zinc-500">Estas regras se aplicam a todos, a menos que substituídas.</p>
                            </div>
                            {PERM_DEFINITIONS.map(def => renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true))}

                            <div className="pt-4 mt-4 border-t border-zinc-800">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-primary" /> Privacidade</h3>
                            </div>
                            {PRIVACY_PERMS.map(def => renderToggle(def, localPerms[def.key as any], () => toggleGlobal(def.key as keyof PermissionSet), true))}
                        </div>
                    )}

                    {activeTab === 'players' && selectedPlayerId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="mb-4 pb-2 border-b border-zinc-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-primary" />
                                    {players.find(p => p.id === selectedPlayerId)?.name}
                                </h3>
                                <p className="text-sm text-zinc-500">Exceções específicas para este jogador.</p>
                            </div>
                            {PERM_DEFINITIONS.map(def => {
                                const override = localPerms.userOverrides[selectedPlayerId]?.[def.key as any];
                                return renderToggle(def, override, () => toggleUserOverride(selectedPlayerId, def.key as keyof PermissionSet), false);
                            })}

                            <div className="pt-4 mt-4 border-t border-zinc-800">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-primary" /> Privacidade</h3>
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
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Visibilidade do Log</h3>
                                <p className="text-sm text-zinc-500">Defina quem pode ver os eventos automáticos do sistema.</p>
                            </div>

                            {[
                                { key: 'movement', label: 'Movimentação', icon: <MousePointer2 className="w-4 h-4" /> },
                                { key: 'combat', label: 'Dano & Cura', icon: <Shield className="w-4 h-4" /> },
                                { key: 'rolls', label: 'Rolagens de Dados', icon: <Dices className="w-4 h-4" /> },
                                { key: 'system', label: 'Eventos de Turno', icon: <ScrollText className="w-4 h-4" /> },
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
                                                <Eye className="w-3 h-3" /> Público
                                            </button>
                                            <button
                                                onClick={() => updateLogConfig(item.key as keyof SessionLogConfig, 'gm')}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isPublic ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                <EyeOff className="w-3 h-3" /> GM Only
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'tokenHover' && campaign && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                            <TokenHoverPermissionsPanel campaign={campaign} onUpdate={() => { }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Aplicar Regras
                </Button>
            </div>
        </Modal>
    );
};
