import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import { campaignService } from '../services/campaignService';
import { characterService } from '../services/characterService';
import { handoutService } from '../services/handoutService';
import { Campaign, Character, User as UserType, Handout, HandoutType } from '../types';
import { Button } from '../components/ui/Button';
import { CharacterSheetViewer } from '../components/vtt/CharacterSheetViewer';
import { HandoutFormModal } from '../components/vtt/HandoutFormModal';
import {
    Calendar, Users, Play, Settings, ArrowLeft, Plus, Copy, Trash2, Map as MapIcon,
    Sword, ScrollText, Crown, User, Check, FileText, Image, Youtube, Share2, Eye, EyeOff
} from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Loading';

const CharacterSelectionModal: React.FC<{
    campaign: Campaign;
    onConfirm: (characterId: string) => void;
    onCreate: () => void;
}> = ({ campaign, onConfirm, onCreate }) => {
    const { user } = useAuth();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const res = await characterService.getUnassignedCharacters(user.id);
            if (res.success && res.data) setCharacters(res.data);
            setIsLoading(false);
        };
        load();
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-2xl font-fantasy text-primary mb-2">Juntar-se à Crônica</h3>
                <p className="text-muted-foreground">Escolha o herói que entrará em <strong className="text-primary">{campaign.name}</strong></p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
            ) : characters.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                    <ScrollText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium">Nenhum herói disponível</p>
                    <p className="text-sm text-muted-foreground mt-2">Crie um novo para esta campanha</p>
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {characters.map(char => (
                        <div
                            key={char.id}
                            onClick={() => setSelectedCharId(char.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedCharId === char.id
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                                }`}
                        >
                            <img src={char.avatarUrl} alt={char.name} className="w-14 h-14 rounded-lg object-cover ring-2 ring-border" />
                            <div className="flex-1">
                                <p className="font-bold text-lg">{char.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {char.species} {char.class} • Nível {char.level}
                                </p>
                            </div>
                            {selectedCharId === char.id && <Check className="w-6 h-6 text-primary" />}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1" size="lg" onClick={onCreate}>
                    <Plus className="w-5 h-5 mr-2" /> Criar Novo Herói
                </Button>
                <Button
                    size="lg"
                    className="flex-1"
                    disabled={!selectedCharId}
                    onClick={() => selectedCharId && onConfirm(selectedCharId)}
                >
                    Entrar na Aventura
                </Button>
            </div>
        </div>
    );
};

type DashboardTab = 'overview' | 'players' | 'characters' | 'handouts';

export const CampaignDashboardView: React.FC = () => {
    const { params, navigateTo } = useNavigation();
    const { user } = useAuth();
    const { show } = useNotification();
    const { openModal, closeModal } = useModal();

    const campaignId = params?.id as string;
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [players, setPlayers] = useState<UserType[]>([]);
    const [handouts, setHandouts] = useState<Handout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
    const [editingHandout, setEditingHandout] = useState<Handout | 'new' | null>(null);

    const loadData = async (id: string = campaignId) => {
        setIsLoading(true);
        const cRes = await campaignService.getById(id);
        if (!cRes.success || !cRes.data) {
            show({ type: 'error', message: 'Campanha não encontrada.' });
            navigateTo('dashboard');
            return;
        }

        setCampaign(cRes.data);

        const [chars, playerList, handoutList] = await Promise.all([
            characterService.getByCampaign(id),
            campaignService.getPlayers(id),
            handoutService.getByCampaign(id)
        ]);

        if (chars.success) setCharacters(chars.data || []);
        if (playerList.success) setPlayers(playerList.data || []);
        if (handoutList.success) {
            setHandouts((handoutList.data || []).sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        }

        setIsLoading(false);
    };

    useEffect(() => {
        if (!campaignId) {
            show({ type: 'error', message: 'Campanha não encontrada.' });
            navigateTo('dashboard');
            return;
        }
        loadData(campaignId);
    }, [campaignId]);

    const isOwner = campaign?.ownerId === user?.id;
    const isMember = campaign?.players.list.includes(user?.id || '') || isOwner;

    const handleLaunchSession = () => {
        if (campaign) navigateTo('game-session', { id: campaign.id });
    };

    const handleInvite = () => {
        const link = `${window.location.origin}/join/${campaign?.id}`;
        navigator.clipboard.writeText(link);
        show({ type: 'success', message: 'Link copiado para a área de transferência!' });
    };

    const handleJoin = () => {
        if (!campaign || !user) return;

        const joinWithCharacter = async (charId: string) => {
            setIsLoading(true);
            closeModal();
            await characterService.update(charId, { campaignId: campaign.id });
            const res = await campaignService.addPlayer(campaign.id, user.id);
            if (res.success) {
                show({ type: 'success', message: `Você entrou em "${campaign.name}"!` });
                loadData();
            }
            setIsLoading(false);
        };

        openModal(
            <CharacterSelectionModal
                campaign={campaign}
                onConfirm={joinWithCharacter}
                onCreate={() => {
                    closeModal();
                    navigateTo('create-character', { campaignId: campaign.id });
                }}
            />,
            { title: 'Juntar-se à Campanha', size: 'lg' }
        );
    };

    // const loadData = () => loadData(campaignId); // Removed recursive bug

    const handleSaveHandout = async (data: Omit<Handout, 'id' | 'createdAt' | 'campaignId'>) => {
        if (!campaign) return;
        const payload = { ...data, campaignId: campaign.id };
        const res = editingHandout === 'new'
            ? await handoutService.create(payload)
            : await handoutService.update((editingHandout as Handout).id, data);

        if (res.success) {
            show({ type: 'success', message: 'Recurso salvo com sucesso!' });
            // Don't reload - WebSocket will handle the update in real-time
            setEditingHandout(null);
        }
    };

    const handleDeleteHandout = (h: Handout) => {
        openModal(
            <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                    <Trash2 className="w-10 h-10 text-destructive" />
                </div>
                <div>
                    <p className="text-lg">Excluir permanentemente</p>
                    <p className="text-2xl font-fantasy text-primary">{h.name}</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                    <Button variant="destructive" onClick={async () => {
                        await handoutService.delete(h.id);
                        loadData();
                        closeModal();
                    }}>Excluir</Button>
                </div>
            </div>,
            { title: 'Excluir Recurso', variant: 'alert' }
        );
    };

    if (isLoading || !campaign) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <MapIcon className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando crônica...</p>
                </div>
            </div>
        );
    }

    const TabButton: React.FC<{ tab: DashboardTab; icon: React.ReactNode; label: string; }> = ({ tab, icon, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-3 px-6 py-4 text-lg font-medium transition-all border-b-4 ${activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
        >
            {icon} {label}
        </button>
    );

    const ICON_MAP: Record<HandoutType, { icon: React.ReactNode; color: string; }> = {
        text: { icon: <FileText className="w-6 h-6" />, color: 'text-blue-400' },
        image: { icon: <Image className="w-6 h-6" />, color: 'text-green-400' },
        video_link: { icon: <Youtube className="w-6 h-6" />, color: 'text-red-400' },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
            {/* Hero Cover */}
            <div className="relative h-96 overflow-hidden">
                <img src={campaign.coverUrl} alt={campaign.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

                <Button
                    variant="ghost"
                    className="absolute top-8 left-8 text-white hover:bg-white/10"
                    onClick={() => navigateTo('dashboard')}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
                </Button>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="px-4 py-2 bg-primary/20 border border-primary/40 rounded-full text-primary font-bold text-sm">
                                        {campaign.system.toUpperCase()}
                                    </span>
                                    <span className="text-white/80 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {campaign.schedule.day}s • {campaign.schedule.time}
                                    </span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-fantasy text-white drop-shadow-2xl mb-2">
                                    {campaign.name}
                                </h1>
                                <p className="text-2xl text-white/90 font-serif italic">
                                    {campaign.lore.worldName}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                {isMember ? (
                                    <Button size="lg" className="text-xl px-10 py-7 shadow-2xl shadow-primary/40" onClick={handleLaunchSession}>
                                        <Play className="w-7 h-7 mr-3" /> Iniciar Sessão
                                    </Button>
                                ) : (
                                    <Button size="lg" className="text-xl px-10 py-7 bg-green-600 hover:bg-green-700 shadow-2xl shadow-green-500/40" onClick={handleJoin}>
                                        <User className="w-7 h-7 mr-3" /> Juntar-se
                                    </Button>
                                )}
                                {isOwner && (
                                    <Tooltip content="Copiar link de convite">
                                        <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={handleInvite}>
                                            <Share2 className="w-6 h-6" />
                                        </Button>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="flex overflow-x-auto">
                        <TabButton tab="overview" icon={<MapIcon />} label="Visão Geral" />
                        <TabButton tab="players" icon={<Users />} label={`Jogadores (${players.length})`} />
                        <TabButton tab="characters" icon={<Sword />} label={`Heróis (${characters.length})`} />
                        {isOwner && <TabButton tab="handouts" icon={<FileText />} label={`Recursos (${handouts.length})`} />}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6 md:p-12">
                {activeTab === 'overview' && (
                    <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-6">
                        <ScrollText className="w-24 h-24 mx-auto text-primary/20" />
                        <h2 className="text-4xl font-fantasy">Bem-vindo à {campaign.name}</h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            {campaign.description || 'Uma nova aventura aguarda os bravos que ousarem entrar neste mundo...'}
                        </p>
                    </div>
                )}

                {activeTab === 'players' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {players.map(p => (
                            <div key={p.id} className="text-center space-y-3">
                                <div className="relative group">
                                    <img src={p.avatarUrl} className="w-24 h-24 rounded-full ring-4 ring-border mx-auto" />
                                    {campaign.ownerId === p.id && (
                                        <Crown className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2" />
                                    )}
                                </div>
                                <p className="font-bold">{p.name}</p>
                                <p className="text-xs text-muted-foreground">Jogador</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'characters' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {characters.map(char => (
                            <div key={char.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-2xl transition-all">
                                <div className="h-48 relative overflow-hidden">
                                    <img src={char.avatarUrl} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-2xl font-fantasy">{char.name}</h3>
                                        <p className="text-sm opacity-90">{char.species} {char.class} • Nível {char.level}</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <Button className="w-full" onClick={() => setViewingCharacter(char)}>
                                        Ver Ficha Completa
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'handouts' && isOwner && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-fantasy">Recursos da Campanha</h2>
                            <Button size="lg" onClick={() => setEditingHandout('new')}>
                                <Plus className="w-5 h-5 mr-2" /> Novo Recurso
                            </Button>
                        </div>

                        {handouts.length === 0 ? (
                            <div className="text-center py-24 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                <FileText className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
                                <p className="text-2xl font-fantasy text-muted-foreground">Nenhum recurso ainda</p>
                                <p className="text-muted-foreground mt-2">Crie handouts, imagens ou links para compartilhar com os jogadores</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {handouts.map(h => {
                                    const { icon, color } = ICON_MAP[h.type];
                                    return (
                                        <div key={h.id} className="bg-card rounded-2xl border border-border p-6 group hover:shadow-2xl transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-4 rounded-xl bg-muted/50 ${color}`}>
                                                    {icon}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Live badge */}
                                                    {(!isOwner && h.sharedWith && h.sharedWith.includes(user?.id)) && (
                                                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full animate-pulse">LIVE</span>
                                                    )}
                                                    <Button size="icon" variant="ghost" onClick={() => setEditingHandout(h)}>
                                                        <Settings className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteHandout(h)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold font-fantasy mb-2">{h.name}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {h.type === 'video_link' ? 'Vídeo (Link)' : h.type}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {viewingCharacter && (
                <Modal isOpen={!!viewingCharacter} onClose={() => setViewingCharacter(null)} size="xl">
                    <CharacterSheetViewer
                        character={viewingCharacter}
                        isGM={isOwner}
                        currentUserId={user?.id}
                        onClose={() => setViewingCharacter(null)}
                        onUpdate={(updates) => characterService.update(viewingCharacter.id, updates).then(res => {
                            if (res.success && res.data) {
                                setCharacters(prev => prev.map(c => c.id === viewingCharacter.id ? res.data! : c));
                                setViewingCharacter(res.data!);
                            }
                        })}
                        onRoll={() => { }}
                        onShare={() => { }}
                    />
                </Modal>
            )}

            {editingHandout && (
                <Modal isOpen={!!editingHandout} onClose={() => setEditingHandout(null)} title={editingHandout === 'new' ? 'Novo Recurso' : 'Editar Recurso'} size="xl">
                    <HandoutFormModal
                        handout={editingHandout === 'new' ? undefined : editingHandout as Handout}
                        onSave={handleSaveHandout}
                        onClose={() => setEditingHandout(null)}
                    />
                </Modal>
            )}
        </div>
    );
};