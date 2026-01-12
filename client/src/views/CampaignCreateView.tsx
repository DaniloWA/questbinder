import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { campaignService } from '../services/campaignService';
import { Campaign, GameSystem, CampaignTone, MapScene } from '../types';
import { getDefaultPermissions } from '../utils/defaultPermissions';
import { Button } from '../components/ui/Button';
import { SheetInput, SheetTextArea, SheetSelect } from '../components/ui/SheetPrimitives';
import { Counter } from '../components/ui/Counter';
import {
  Sword, Map, Calendar, Users, ArrowLeft,
  ChevronRight, Dna, Skull, Ghost, Sparkles, Tent
} from 'lucide-react';

// --- CONSTANTS ---
const SYSTEMS: { id: GameSystem; name: string; icon: React.ReactNode; color: string; }[] = [
  { id: 'dnd5e', name: 'Dungeons & Dragons 5e', icon: <Sword />, color: 'border-red-500 bg-red-500/5 text-red-600' },
  { id: 'pf2e', name: 'Pathfinder 2e', icon: <Map />, color: 'border-blue-500 bg-blue-500/5 text-blue-600' },
  { id: 'tormenta20', name: 'Tormenta20', icon: <Skull />, color: 'border-red-800 bg-red-800/5 text-red-900' },
  { id: 'call_of_cthulhu', name: 'Call of Cthulhu', icon: <Ghost />, color: 'border-emerald-800 bg-emerald-800/5 text-emerald-900' },
  { id: 'custom', name: 'Sistema Próprio', icon: <Dna />, color: 'border-amber-500 bg-amber-500/5 text-amber-600' },
];

const TONES: { id: CampaignTone; name: string; desc: string; }[] = [
  { id: 'heroic', name: 'Heroico', desc: 'O bem contra o mal, feitos épicos e esperança.' },
  { id: 'gritty', name: 'Realista', desc: 'Sobrevivência difícil, ferimentos duradouros.' },
  { id: 'dark', name: 'Dark Fantasy', desc: 'Mundo sombrio, escolhas morais cinzentas.' },
  { id: 'mystery', name: 'Mistério', desc: 'Investigação, segredos e suspense.' },
  { id: 'whimsical', name: 'Fantástico', desc: 'Magia abundante, criaturas feéricas e maravilhas.' },
];

const WEEKDAYS = [
  { label: 'Segunda', value: 'Segunda-feira' },
  { label: 'Terça', value: 'Terça-feira' },
  { label: 'Quarta', value: 'Quarta-feira' },
  { label: 'Quinta', value: 'Quinta-feira' },
  { label: 'Sexta', value: 'Sexta-feira' },
  { label: 'Sábado', value: 'Sábado' },
  { label: 'Domingo', value: 'Domingo' },
];

export const CampaignCreateView: React.FC = () => {
  const { navigateTo, params } = useNavigation();
  const { user } = useAuth();
  const { show } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [system, setSystem] = useState<GameSystem>('dnd5e');
  const [description, setDescription] = useState('');
  const [worldName, setWorldName] = useState('');
  const [tone, setTone] = useState<CampaignTone>('heroic');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=1000&auto=format&fit=crop');
  const [hooks, setHooks] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'irregular'>('weekly');
  const [day, setDay] = useState('Sábado');
  const [time, setTime] = useState('19:00');
  const [maxPlayers, setMaxPlayers] = useState(5);

  useEffect(() => {
    if (params?.id) {
      loadCampaign(params.id);
    }
  }, [params]);

  const loadCampaign = async (id: string) => {
    setIsLoading(true);
    const result = await campaignService.getById(id);
    if (result.success && result.data) {
      const c = result.data;
      setName(c.name);
      setSystem(c.system);
      setDescription(c.description);
      setWorldName(c.lore.worldName);
      setTone(c.theme);
      setCoverUrl(c.coverUrl);
      setHooks(c.lore.hooks);
      setFrequency(c.schedule.frequency as 'weekly' | 'biweekly' | 'monthly' | 'irregular');
      setDay(c.schedule.day);
      setTime(c.schedule.time);
      setMaxPlayers(c.players.max);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { show({ type: 'error', message: 'Sua crônica precisa de um título.' }); return; }

    setIsLoading(true);

    // FIX: Add missing properties `scenes` and `activeSceneId` to satisfy the Campaign type.
    const defaultSceneId = `scene-${Date.now()}`;
    const defaultScene: MapScene = {
      id: defaultSceneId,
      name: 'Primeira Cena',
      imageUrl: '',
      grid: { size: 70, color: '#FFFFFF', alpha: 0.2, cols: 40, rows: 30, unitsPerSquare: 1.5 },
      ambientLight: 1.0,
      fogPath: '',
      obstacles: [],
      lightZones: [],
      audioZones: [],
      triggerZones: [],
      drawings: [],
      tokens: []
    };

    const campaignData: Omit<Campaign, 'id' | 'createdAt'> = {
      ownerId: user.id,
      name,
      system,
      description,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=1000&auto=format&fit=crop',
      theme: tone,
      status: 'planning',
      schedule: {
        frequency,
        day,
        time,
      },
      players: {
        current: 0,
        max: maxPlayers,
        list: []
      },
      lore: {
        worldName: worldName || 'Reino Desconhecido',
        hooks: hooks || 'A aventura começa em uma taverna...'
      },
      scenes: [defaultScene],
      activeSceneId: defaultSceneId,
      permissions: getDefaultPermissions(),
      audioSettings: {
        playlists: [],
        soundboard: []
      },
    };

    let result;
    if (params?.id) {
      result = await campaignService.update(params.id, campaignData);
    } else {
      result = await campaignService.create(campaignData);
    }

    if (result.success && result.data) {
      show({ type: 'success', title: 'Mundo Forjado!', message: `A campanha "${name}" está pronta.` });
      // Redirect to Campaign Dashboard instead of main Dashboard
      navigateTo('campaign-dashboard', { id: result.data.id });
    } else {
      show({ type: 'error', message: result.message || 'Erro ao salvar campanha.' });
    }
    setIsLoading(false);
  };

  // --- STEPS RENDERERS ---
  const renderStep1 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-fantasy text-primary mb-2">A Fundação</h2>
        <p className="text-muted-foreground">Escolha o sistema de regras e nomeie sua lenda.</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <SheetInput variant="title" placeholder="Título da Campanha" value={name} onChange={e => setName(e.target.value)} className="text-center" autoFocus />
          <SheetTextArea placeholder="Uma breve descrição da premissa..." className="h-24 text-center bg-transparent border-none focus:ring-0 text-lg resize-none" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEMS.map(sys => (
            <div key={sys.id} onClick={() => setSystem(sys.id)} className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all hover:-translate-y-1 ${system === sys.id ? `${sys.color} ring-2 ring-offset-2 ring-primary/20 shadow-md` : 'border-border bg-card hover:border-primary/30'}`}>
              <div className={`p-3 rounded-full ${system === sys.id ? 'bg-white/20' : 'bg-muted'}`}>{sys.icon}</div>
              <span className="font-bold text-sm text-center">{sys.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center"><h2 className="text-3xl font-fantasy text-primary mb-2">O Cenário</h2><p className="text-muted-foreground">Defina a atmosfera e a imagem do seu mundo.</p></div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <SheetInput label="Nome do Mundo" value={worldName} onChange={e => setWorldName(e.target.value)} placeholder="Ex: Faerûn, Arton..." />
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Tom da Campanha</span>
            <div className="space-y-2">
              {TONES.map(t => (
                <div key={t.id} onClick={() => setTone(t.id)} className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${tone === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-accent'}`}>
                  <span className="font-bold text-sm">{t.name}</span>
                  <span className="text-xs text-muted-foreground max-w-[180px] text-right">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <SheetTextArea label="Ganchos de Aventura" value={hooks} onChange={e => setHooks(e.target.value)} placeholder="Rumores sobre o Rei Louco..." className="h-32" />
        </div>
        <div className="space-y-4">
          <SheetInput label="URL da Imagem de Capa" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
          <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border-4 border-card shadow-2xl relative bg-black">
            <img src={coverUrl} alt="Capa" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x800?text=Sem+Capa')} />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/60 to-transparent text-white">
              <h3 className="text-2xl font-fantasy font-bold mb-1">{name || 'Sua Campanha'}</h3>
              <p className="text-sm opacity-80 flex items-center gap-2"><Map className="w-3 h-3" /> {worldName || 'Mundo'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center"><h2 className="text-3xl font-fantasy text-primary mb-2">Logística</h2><p className="text-muted-foreground">Quando e como a aventura acontece.</p></div>
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8 space-y-8 shadow-sm">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2"><span className="text-xs font-bold uppercase text-muted-foreground">Frequência</span><SheetSelect value={frequency} onChange={(v) => setFrequency(v as any)} options={[{ label: 'Semanal', value: 'weekly' }, { label: 'Quinzenal', value: 'biweekly' }, { label: 'Mensal', value: 'monthly' }, { label: 'Irregular', value: 'irregular' }]} className="text-lg font-bold" /></div>
          <div className="space-y-2"><span className="text-xs font-bold uppercase text-muted-foreground">Dia da Semana</span><SheetSelect value={day} onChange={setDay} options={WEEKDAYS} className="text-lg font-bold" /></div>
        </div>
        <div className="grid grid-cols-2 gap-6 items-center">
          <div className="space-y-2"><span className="text-xs font-bold uppercase text-muted-foreground">Horário</span><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-transparent border-b border-border text-2xl font-bold outline-none focus:border-primary p-1" /></div>
          <div className="space-y-2 flex flex-col items-center"><span className="text-xs font-bold uppercase text-muted-foreground">Max. Jogadores</span><Counter value={maxPlayers} onChange={setMaxPlayers} min={1} max={12} /></div>
        </div>
        <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border flex items-center gap-4"><Tent className="w-8 h-8 text-muted-foreground" /><div className="text-sm text-muted-foreground"><p>Sessões acontecerão <strong>{frequency === 'weekly' ? 'toda semana' : frequency === 'biweekly' ? 'a cada 15 dias' : 'uma vez por mês'}</strong>,</p><p>aos <strong>{day}s</strong> às <strong>{time}</strong>.</p></div></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-20 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-50">
        <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">Cancelar</span>
        </button>
        <div className="flex items-center gap-2">{[1, 2, 3].map(i => (<div key={i} className={`w-3 h-3 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-muted'}`}></div>))}</div>
        <div className="font-fantasy font-bold text-lg text-foreground">Criar Campanha</div>
      </header>
      <main className="flex-1 py-12 px-4">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </main>
      <footer className="h-20 border-t border-border bg-card flex items-center justify-center gap-6 fixed bottom-0 w-full z-40">
        {step > 1 && (<Button variant="outline" onClick={() => setStep(step - 1)} className="w-32">Voltar</Button>)}
        {step < 3 ? (<Button onClick={() => setStep(step + 1)} className="w-32 shadow-lg shadow-primary/20">Próximo <ChevronRight className="w-4 h-4 ml-1" /></Button>) : (<Button onClick={handleSave} isLoading={isLoading} className="w-48 shadow-xl shadow-primary/30 text-lg"><Sparkles className="w-5 h-5 mr-2" /> Criar Mundo</Button>)}
      </footer>
    </div>
  );
};