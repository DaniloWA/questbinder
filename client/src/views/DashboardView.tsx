import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useModal } from '../context/ModalContext';
import { useNotification } from '../context/NotificationContext';
import { characterService } from '../services/characterService';
import { campaignService } from '../services/campaignService';
import { Character, Campaign, User } from '../types';
import { Skeleton } from '../components/ui/Loading';
import { SheetSelect } from '../components/ui/SheetPrimitives';
import { CLASSES, RACES } from '../data/rules';
import {
  LogOut, Bell, Menu, Sword, Scroll, Map, BookOpen, Crown,
  Dice5, Plus, Search, Users, Compass, Trash2, Edit, Heart,
  Shield, Activity, Calendar, Play, User as UserIcon, Sparkles, Settings
} from 'lucide-react';

type DashboardTab = 'overview' | 'heroes' | 'campaigns' | 'library';

export const DashboardView: React.FC = () => {
  const { user, logout } = useAuth();
  const { navigateTo } = useNavigation();
  const { openModal, closeModal } = useModal();
  const { show } = useNotification();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Dados
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  const [isLoadingChars, setIsLoadingChars] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name_asc' | 'level_desc'>('newest');
  const [campaignSearch, setCampaignSearch] = useState('');

  // Carrega tudo de uma vez
  useEffect(() => {
    if (!user?.id) return;

    const loadAll = async () => {
      await Promise.all([
        loadCharacters(),
        loadCampaigns(),
        loadUsers()
      ]);
    };

    loadAll();
  }, [user?.id]);

  const loadUsers = async () => {
    const result = await campaignService.getAllUsers();
    if (result.success && result.data) {
      const map = result.data.reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, User>);
      setUsersMap(map);
    }
  };

  const loadCharacters = async () => {
    setIsLoadingChars(true);
    const result = await characterService.getAll(user!.id);
    if (result.success && result.data) setCharacters(result.data);
    setIsLoadingChars(false);
  };

  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true);
    const result = await campaignService.getAll(user!.id);
    if (result.success && result.data) setCampaigns(result.data);
    setIsLoadingCampaigns(false);
  };

  // Handlers seguros
  const handleLogoutClick = () => {
    openModal(
      <div className="space-y-6 text-center">
        <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
        <p className="text-muted-foreground text-lg">
          Deseja deixar a taverna por hoje, <strong>{user?.name?.split(' ')[0]}</strong>?
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="ghost" size="lg" onClick={closeModal}>Ficar mais um pouco</Button>
          <Button variant="destructive" size="lg" onClick={() => { closeModal(); logout(); }}>
            Sair da Taverna
          </Button>
        </div>
      </div>,
      { title: 'Até a próxima aventura!', variant: 'alert', size: 'md' }
    );
  };

  const handleDeleteChar = (e: React.MouseEvent, char: Character) => {
    e.stopPropagation();
    openModal(
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <Trash2 className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <p className="text-lg">Você realmente deseja apagar</p>
          <p className="text-2xl font-fantasy text-primary mt-2">{char.name}</p>
          <p className="text-muted-foreground mt-2">Esta ação não pode ser desfeita.</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
          <Button variant="destructive" onClick={async () => {
            await characterService.delete(char.id);
            closeModal();
            show({ type: 'success', message: `${char.name} foi para Valhalla.` });
            loadCharacters();
          }}>Excluir para sempre</Button>
        </div>
      </div>,
      { title: 'Excluir Herói', variant: 'alert', size: 'md' }
    );
  };

  // Filtragem otimizada com useMemo
  const filteredCharacters = useMemo(() => {
    return characters
      .filter(char => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = char.name.toLowerCase().includes(term) ||
          char.species.toLowerCase().includes(term) ||
          char.class.toLowerCase().includes(term);
        const matchesClass = filterClass ? char.class === filterClass : true;
        return matchesSearch && matchesClass;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'level_desc': return b.level - a.level;
          case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'newest':
          default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [characters, searchTerm, filterClass, sortOrder]);

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.toLowerCase();
    return campaigns.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.system.toLowerCase().includes(term) ||
      c.lore.worldName.toLowerCase().includes(term)
    );
  }, [campaigns, campaignSearch]);

  // Renderização dos tabs
  const renderOverview = () => (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-fantasy font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-pulse">
          Bem-vindo de volta, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-xl text-muted-foreground mt-4">O destino te chama. Novas lendas aguardam.</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div onClick={() => navigateTo('create-character')} className="group cursor-pointer">
          <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all">
              <Plus className="w-10 h-10 text-primary group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-fantasy mb-3">Criar Personagem</h3>
            <p className="text-muted-foreground">Forje um novo herói para a eternidade.</p>
          </div>
        </div>

        <div onClick={() => navigateTo('create-campaign')} className="group cursor-pointer">
          <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-destructive hover:shadow-2xl hover:shadow-destructive/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-destructive group-hover:scale-110 transition-all">
              <Crown className="w-10 h-10 text-destructive group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-fantasy mb-3">Criar Campanha</h3>
            <p className="text-muted-foreground">Torne-se Mestre e crie um mundo inteiro.</p>
          </div>
        </div>

        <div onClick={() => setActiveTab('campaigns')} className="group cursor-pointer">
          <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-secondary hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 mx-auto bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:scale-110 transition-all">
              <Users className="w-10 h-10 text-secondary group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-fantasy mb-3">Minhas Campanhas</h3>
            <p className="text-muted-foreground">Volte para suas aventuras atuais.</p>
          </div>
        </div>
      </div>

      {/* Últimos personagens */}
      {characters.length > 0 && (
        <div>
          <h2 className="text-3xl font-fantasy mb-8 flex items-center gap-3">
            <Scroll className="w-8 h-8 text-primary" />
            Últimos Heróis Criados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.slice(0, 8).map(char => (
              <div key={char.id} onClick={() => navigateTo('create-character', { id: char.id })}
                className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-xl transition-all cursor-pointer group">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-600/20 relative overflow-hidden">
                  <img src={char.avatarUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-4">
                  <h3 className="font-fantasy text-lg font-bold truncate">{char.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {RACES.find(r => r.id === char.species)?.name} {CLASSES.find(c => c.id === char.class)?.name} • Nível {char.level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderHeroesTab = () => (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-fantasy text-primary">Meus Heróis</h1>
          <p className="text-muted-foreground mt-2">Suas lendas vivas, prontas para batalha.</p>
        </div>
        <Button size="lg" onClick={() => navigateTo('create-character')} className="shadow-lg shadow-primary/30">
          <Plus className="w-5 h-5 mr-2" /> Novo Herói
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar herói..."
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <SheetSelect
            placeholder="Todas as Classes"
            value={filterClass}
            onChange={setFilterClass}
            options={[{ label: 'Todas as Classes', value: '' }, ...CLASSES.map(c => ({ label: c.name, value: c.id }))]}
          />
          <SheetSelect
            placeholder="Ordenar por"
            value={sortOrder}
            onChange={v => setSortOrder(v as any)}
            options={[
              { label: 'Mais Recentes', value: 'newest' },
              { label: 'Mais Antigos', value: 'oldest' },
              { label: 'Nome (A-Z)', value: 'name_asc' },
              { label: 'Nível (Maior)', value: 'level_desc' }
            ]}
          />
        </div>
      </div>

      {/* Grid de heróis */}
      {isLoadingChars ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="text-center py-24">
          <Scroll className="w-24 h-24 mx-auto text-muted-foreground/30 mb-6" />
          <p className="text-2xl font-fantasy text-muted-foreground">Nenhum herói encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCharacters.map(char => {
            const cls = CLASSES.find(c => c.id === char.class);
            return (
              <div key={char.id} className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary/50 transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img src={char.avatarUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-fantasy text-white drop-shadow-lg">{char.name}</h3>
                    <p className="text-sm text-white/90 drop-shadow">
                      {RACES.find(r => r.id === char.species)?.name} {cls?.name} • Nível {char.level}
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Heart className="w-5 h-5 mx-auto text-red-500 mb-1" />
                      <p className="font-bold text-lg">{char.hpMax}</p>
                      <p className="text-xs text-muted-foreground">Vida</p>
                    </div>
                    <div>
                      <Shield className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                      <p className="font-bold text-lg">{char.armorClass}</p>
                      <p className="text-xs text-muted-foreground">CA</p>
                    </div>
                    <div>
                      <Activity className="w-5 h-5 mx-auto text-green-500 mb-1" />
                      <p className="font-bold text-lg">{char.passivePerception}</p>
                      <p className="text-xs text-muted-foreground">Percepção</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigateTo('create-character', { id: char.id }); }}>
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={(e) => handleDeleteChar(e, char)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-fantasy bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Minhas Crônicas
        </h1>
        <p className="text-xl text-muted-foreground mt-4">Mundos que você criou ou onde sua lenda vive.</p>
      </div>

      <div className="flex justify-end mb-6">
        <Button size="lg" onClick={() => navigateTo('create-campaign')} className="shadow-2xl shadow-primary/40">
          <Crown className="w-6 h-6 mr-3" /> Forjar Novo Mundo
        </Button>
      </div>

      {isLoadingCampaigns ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-32">
          <Map className="w-32 h-32 mx-auto text-muted-foreground/20 mb-8" />
          <h2 className="text-4xl font-fantasy text-muted-foreground mb-4">O Mapa Está em Branco</h2>
          <p className="text-xl text-muted-foreground mb-8">Nenhuma campanha criada ainda.</p>
          <Button size="lg" onClick={() => navigateTo('create-campaign')}>
            Criar Minha Primeira Campanha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCampaigns.map(campaign => {
            const owner = usersMap[campaign.ownerId];
            const isGM = owner?.id === user?.id;

            return (
              <div key={campaign.id} className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 cursor-pointer"
                onClick={() => navigateTo('campaign-dashboard', { id: campaign.id })}>
                <div className="aspect-video relative">
                  <img src={campaign.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  <div className="absolute top-6 right-6">
                    <div className={`px-4 py-2 rounded-full text-white font-bold text-sm backdrop-blur-md ${isGM ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-primary/90'}`}>
                      {isGM ? 'MESTRE' : 'JOGADOR'}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-4xl font-fantasy text-white drop-shadow-2xl mb-2">
                      {campaign.name}
                    </h3>
                    <p className="text-xl text-white/90 font-serif italic drop-shadow-lg">
                      {campaign.lore.worldName}
                    </p>
                  </div>
                </div>

                <div className="bg-card p-8 space-y-6">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">{campaign.schedule.day}s • {campaign.schedule.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <span className="font-bold text-primary">{campaign.players.current}/{campaign.players.max}</span>
                    </div>
                  </div>

                  <Button size="lg" className="w-full text-lg font-fantasy py-7 shadow-xl">
                    <Settings className="w-6 h-6 mr-3" />
                    Gerenciar Campanha
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-80 bg-card border-r border-border transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-8 border-b border-border bg-gradient-to-r from-primary/10">
            <Dice5 className="w-10 h-10 text-primary mr-4" />
            <span className="text-2xl font-fantasy font-bold tracking-wider">QuestBinder</span>
          </div>

          <nav className="flex-1 px-6 py-8 space-y-3">
            <NavButton icon={<Compass />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <NavButton icon={<Scroll />} label="Meus Heróis" active={activeTab === 'heroes'} onClick={() => setActiveTab('heroes')} />
            <NavButton icon={<Map />} label="Campanhas" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
            <NavButton icon={<BookOpen />} label="Grimório" onClick={() => show({ type: 'info', message: 'Em breve!' })} />
          </nav>

          <div className="p-6 border-t border-border space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-4">
              <img src={user?.avatarUrl} className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/20" />
              <div className="flex-1">
                <p className="font-fantasy font-bold text-lg">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Aventureiro Lendário</p>
              </div>
              <button onClick={handleLogoutClick} className="p-3 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <div className="p-6 md:p-12 lg:p-16">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'heroes' && renderHeroesTab()}
            {activeTab === 'campaigns' && renderCampaignsTab()}
          </div>
        </div>
      </main>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};

// Componente de navegação da sidebar
const NavButton: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; }> = ({
  icon, label, active, onClick
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${active
      ? 'bg-primary text-white shadow-lg shadow-primary/25'
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
      }`}
  >
    <div className={`transition-transform duration-300 group-hover:scale-125 ${active ? 'text-white' : ''}`}>
      {icon}
    </div>
    <span className="font-medium text-lg">{label}</span>
    {active && <div className="ml-auto w-3 h-3 rounded-full bg-white animate-pulse" />}
  </button>
);