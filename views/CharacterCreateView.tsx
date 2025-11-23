
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { characterService } from '../services/characterService';
import { campaignService } from '../services/campaignService';
import {
  Character, Attributes, SkillName, CharacterPersonality,
  Attack, InventoryItem, Spell, Feature, Currency, CharacterAppearance, SpellSlot,
  CharacterSpeciesId, CharacterClassId, OriginId, AlignmentId, CharacterTokenSettings, LightConfig, LightAnimationType, TokenShape
} from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tooltip } from '../components/ui/Tooltip';
import { Counter } from '../components/ui/Counter';
import { ColorPicker } from '../components/ui/ColorPicker';
import {
  SheetCard, SheetHeader, SheetLabel, SheetInput, SheetTextArea, SheetSelect, SheetStatBlock, SheetListItem
} from '../components/ui/SheetPrimitives';
import {
  Sword, Shield, Book, Wand2, Heart,
  ChevronRight, ChevronLeft, Dice5,
  Brain, Flame, Feather, Skull, Gavel, Crown,
  Lock, Unlock, Backpack, Scroll, Plus, Trash2,
  Eye, User, Zap, Info, Save,
  ChevronDown, Target, Crosshair, Leaf, Activity, Sparkles,
  Hand, Moon, Wind, ScanEye, Sun, Lightbulb, Circle, Square, Hexagon, RotateCw, UploadCloud, Image as ImageIcon, Type
} from 'lucide-react';

// Import Centralized Rules
import {
  CLASSES, RACES, BACKGROUNDS, ALIGNMENTS, SKILLS_DATA,
  ATTRIBUTE_OPTIONS, DAMAGE_TYPES, SPELL_SCHOOLS
} from '../data/rules';

// Icon Mapping for Dynamic Data
const ICON_MAP: Record<string, React.ReactNode> = {
  guerreiro: <Sword className="w-6 h-6" />,
  mago: <Wand2 className="w-6 h-6" />,
  ladino: <Skull className="w-6 h-6" />,
  clerigo: <Heart className="w-6 h-6" />,
  barbaro: <Flame className="w-6 h-6" />,
  bardo: <Feather className="w-6 h-6" />,
  druida: <Leaf className="w-6 h-6" />,
  monge: <Activity className="w-6 h-6" />,
  paladino: <Shield className="w-6 h-6" />,
  patrulheiro: <Crosshair className="w-6 h-6" />,
  feiticeiro: <Sparkles className="w-6 h-6" />,
  bruxo: <Eye className="w-6 h-6" />,
};

const INITIAL_STATS: Attributes = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, cou: 10 };

// Extended Tooltip Data
const TOOLTIPS: Record<string, string> = {
  str: "Mede poder físico, força bruta e capacidade atlética. Importante para Guerreiros e Bárbaros.",
  dex: "Mede agilidade, reflexos e equilíbrio. Importante para Ladinos e CA.",
  con: "Mede saúde, vigor e força vital. Importante para PV de todas as classes.",
  int: "Mede acuidade mental, memória e raciocínio lógico. Importante para Magos.",
  wis: "Mede percepção, intuição e força de vontade. Importante para Clérigos e Druidas.",
  cha: "Mede confiança, eloquência e liderança. Importante para Bardos, Feiticeiros e Paladinos.",
  cou: "Mede bravura, heroísmo e resistência ao medo (Atributo Homebrew).",
  ac: "Classe de Armadura. Define quão difícil é acertar você. Base 10 + DES + Armadura.",
  init: "Iniciativa. Bônus somado ao d20 para definir a ordem de combate (Baseado em DES).",
  speed: "Deslocamento. O quanto você pode andar por turno em metros.",
  prof: "Bônus de Proficiência. Adicionado a testes em que você tem treino. Sobe com o nível.",
  inspiration: "Inspiração. Um recurso ganho por boa interpretação para obter vantagem.",
  passivePerception: "O quão atento você está quando não está procurando ativamente. 10 + Sabedoria.",
  hp: "Pontos de Vida Atuais/Máximos. Se chegar a 0, você cai inconsciente.",
  hitDice: "Dados de Vida. Use durante Descansos Curtos para recuperar PV.",
  deathSaves: "Salvaguardas contra Morte. 3 Sucessos estabilizam, 3 Falhas matam.",
  spellDC: "Dificuldade (CD) que inimigos devem superar para resistir às suas magias.",
  spellAtk: "Bônus somado ao d20 quando você faz um ataque mágico.",
  xp: "Pontos de Experiência. Acumule para subir de nível.",
  skills: "Perícias representam treinamentos específicos. Marque para adicionar Proficiência.",
  saves: "Salvaguardas representam a capacidade de resistir a efeitos nocivos.",
  addAttack: "Adicionar um novo ataque à lista.",
  addItem: "Adicionar um novo item ao inventário.",
  addSpell: "Adicionar uma nova magia ao grimório.",
  addFeature: "Adicionar uma nova característica ou talento.",
  manualMode: "Permite editar todos os campos livremente, ignorando regras de criação.",
  guidedMode: "Segue as regras oficiais para distribuição de pontos e escolhas.",
  vision: "Alcance de visão normal em metros.",
  darkvision: "Alcance de visão no escuro em metros.",
};

// Calculation Helpers
const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

// Helper for Hex Alpha
const rgbaToHexAlpha = (color: string) => {
  if (!color) return { hex: '#ffffff', alpha: 0.2 };
  if (color.startsWith('#')) return { hex: color.slice(0, 7), alpha: 1 };
  const parts = color.match(/[\d\.]+/g);
  if (!parts || parts.length < 3) return { hex: '#ffffff', alpha: 0.2 };
  const r = parseInt(parts[0]);
  const g = parseInt(parts[1]);
  const b = parseInt(parts[2]);
  const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, alpha: a };
};

const hexAlphaToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const CharacterCreateView: React.FC = () => {
  const { navigateTo, params } = useNavigation();
  const { user } = useAuth();
  const { show } = useNotification();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'combat' | 'magic' | 'inventory' | 'bio' | 'token'>('core');
  const [isManual, setIsManual] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // --- CHARACTER STATE ---

  // Wizard States
  const [heroName, setHeroName] = useState('');
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBg, setSelectedBg] = useState<string>('');
  const [selectedAlignment, setSelectedAlignment] = useState<string>('');
  const [level, setLevel] = useState(1);
  const [attributes, setAttributes] = useState<Attributes>(INITIAL_STATS);
  const [pointsRemaining, setPointsRemaining] = useState(27);
  const [selectedSkills, setSelectedSkills] = useState<SkillName[]>([]);
  const [personality, setPersonality] = useState<CharacterPersonality>({
    traits: '', ideals: '', bonds: '', flaws: ''
  });

  // --- SHEET EXTENDED STATE ---
  const [xp, setXp] = useState('0');
  const [inspiration, setInspiration] = useState(false);
  const [passivePerception, setPassivePerception] = useState(10);

  // Appearance
  const [appearance, setAppearance] = useState<CharacterAppearance>({
    age: '', height: '', weight: '', eyes: '', skin: '', hair: ''
  });
  const [bio, setBio] = useState('');
  const [alliesAndOrgs, setAlliesAndOrgs] = useState('');
  const [otherProficiencies, setOtherProficiencies] = useState('');

  // Combat
  const [hpMax, setHpMax] = useState(0);
  const [hpCurrent, setHpCurrent] = useState(0);
  const [hpTemp, setHpTemp] = useState(0);
  const [hitDiceTotal, setHitDiceTotal] = useState('1d8');
  const [hitDiceCurrent, setHitDiceCurrent] = useState(1);
  const [deathSaves, setDeathSaves] = useState({ successes: 0, failures: 0 });
  const [armorClass, setArmorClass] = useState(10);
  const [speed, setSpeed] = useState(9);
  const [movementDetails, setMovementDetails] = useState('');
  const [visionRange, setVisionRange] = useState(30);
  const [darkvisionRange, setDarkvisionRange] = useState(0);
  const [initiative, setInitiative] = useState(0);
  const [profBonus, setProfBonus] = useState(2);

  // Token Settings
  const [tokenSettings, setTokenSettings] = useState<CharacterTokenSettings>({
    shape: 'circle',
    size: 1,
    scale: 1,
    border: { color: '#3b82f6', width: 3 },
    vision: { range: 30, darkvision: 0, color: 'rgba(255, 255, 255, 0.2)' },
    light: { enabled: false, brightRadius: 0, dimRadius: 0, color: '#fbbf24', intensity: 0.5, animation: 'none' },
    imgUrl: '',
    displayMode: 'image',
    textDetails: { text: '', backgroundColor: '#333333', textColor: '#ffffff' }
  });

  // UI State for Attacks
  const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null);

  // Inventory & Magic
  const [currency, setCurrency] = useState<Currency>({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
  const [treasure, setTreasure] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [spellInfo, setSpellInfo] = useState({ class: 'Mago', ability: 'int', saveDc: 10, atkBonus: 2 });
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([
    { level: 1, total: 2, used: 0 },
    { level: 2, total: 0, used: 0 },
    { level: 3, total: 0, used: 0 },
  ]);
  const [features, setFeatures] = useState<Feature[]>([]);

  // --- INITIALIZATION LOGIC ---

  // Check for Edit Mode on Mount
  useEffect(() => {
    if (params?.id) {
      setEditingId(params.id);
      loadCharacter(params.id);
    }
    if (params?.campaignId) {
      setCampaignId(params.campaignId);
    }
  }, [params]);

  const loadCharacter = async (id: string) => {
    setIsLoading(true);
    const result = await characterService.getById(id);
    if (result.success && result.data) {
      const c = result.data;
      setHeroName(c.name);
      setSelectedRace(c.species);
      setSelectedClass(c.class);
      setSelectedBg(c.origin);
      setSelectedAlignment(c.alignment);
      setLevel(c.level);
      setAttributes(c.attributes);
      setSelectedSkills(c.skills);
      setPersonality(c.personality);
      setAppearance(c.appearance);
      setXp(c.experience);
      setInspiration(c.heroicInspiration);
      setPassivePerception(c.passivePerception);

      setHpMax(c.hpMax);
      setHpCurrent(c.hpCurrent);
      setHpTemp(c.hpTemp);
      setHitDiceTotal(c.hitDiceTotal);
      setHitDiceCurrent(c.hitDiceCurrent);
      setDeathSaves(c.deathSaves);
      setArmorClass(c.armorClass);
      setSpeed(c.speed);
      setMovementDetails(c.movementDetails || '');
      setVisionRange(c.visionRange || 30);
      setDarkvisionRange(c.darkvisionRange || 0);
      setInitiative(c.initiative);
      setProfBonus(c.profBonus);

      setCurrency(c.currency);
      setTreasure(c.treasure);
      setInventory(c.inventory);
      setAttacks(c.attacks);
      setSpells(c.spells);
      setSpellInfo(c.spellInfo);
      setSpellSlots(c.spellSlots);
      setFeatures(c.features);
      setAlliesAndOrgs(c.alliesAndOrgs);
      setBio(c.bio || '');

      // Load Token Settings (or default if missing on legacy)
      if (c.tokenSettings) {
        setTokenSettings({
          ...c.tokenSettings,
          displayMode: c.tokenSettings.displayMode || 'image',
          textDetails: c.tokenSettings.textDetails || { text: c.name.substring(0, 2).toUpperCase(), backgroundColor: '#333333', textColor: '#ffffff' }
        });
      } else {
        // Legacy Migration
        setTokenSettings({
          shape: 'circle', size: 1, scale: 1,
          displayMode: 'image',
          textDetails: { text: c.name.substring(0, 2).toUpperCase(), backgroundColor: '#333333', textColor: '#ffffff' },
          border: { color: '#3b82f6', width: 3 },
          vision: { range: c.visionRange || 30, darkvision: c.darkvisionRange || 0, color: 'rgba(255, 255, 255, 0.2)' },
          light: { enabled: false, brightRadius: 0, dimRadius: 0, color: '#fbbf24', intensity: 0.5, animation: 'none' },
          imgUrl: c.avatarUrl || ''
        });
      }

      // Skip to sheet
      setStep(5);
      setIsManual(true); // Enable manual mode for editing
    } else {
      show({ type: 'error', message: 'Falha ao carregar personagem.' });
      navigateTo('dashboard');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Only calculate auto-stats if we are creating a NEW character (not editing)
    // or if we haven't reached the sheet yet
    if (step === 5 && hpMax === 0 && !editingId) {
      const raceData = RACES.find(r => r.id === selectedRace);
      const classData = CLASSES.find(c => c.id === selectedClass);

      const conMod = calculateModifier(attributes.con);
      const dexMod = calculateModifier(attributes.dex);
      const wisMod = calculateModifier(attributes.wis);
      const intMod = calculateModifier(attributes.int);

      const pb = 2 + Math.floor((level - 1) / 4);
      setProfBonus(pb);

      const calculatedHp = Math.max(1, (classData?.hitDie || 8) + conMod);
      setHpMax(calculatedHp);
      setHpCurrent(calculatedHp);
      setHitDiceTotal(`${level}d${classData?.hitDie || 8}`);
      setHitDiceCurrent(level);
      setArmorClass(10 + dexMod);
      setSpeed(raceData?.speed || 9);

      // Set vision defaults based on race
      if (['elfo', 'anao', 'gnomo', 'tiefling', 'meio-orc', 'dragonborn'].includes(selectedRace)) {
        setDarkvisionRange(18);
      } else {
        setDarkvisionRange(0);
      }
      setVisionRange(30); // Default "Line of Sight" assumed decent

      setInitiative(dexMod);
      setPassivePerception(10 + wisMod + (selectedSkills.includes('perception') ? pb : 0));

      let spellAbility = 'int';
      if (selectedClass === 'clerigo' || selectedClass === 'druida' || selectedClass === 'patrulheiro') spellAbility = 'wis';
      if (selectedClass === 'bardo' || selectedClass === 'paladino' || selectedClass === 'feiticeiro' || selectedClass === 'bruxo') spellAbility = 'cha';

      let spellMod = 0;
      if (spellAbility === 'int') spellMod = intMod;
      if (spellAbility === 'wis') spellMod = wisMod;
      if (spellAbility === 'cha') spellMod = calculateModifier(attributes.cha);

      setSpellInfo({
        class: classData?.name || '',
        ability: spellAbility,
        saveDc: 8 + pb + spellMod,
        atkBonus: pb + spellMod
      });

      if (inventory.length === 0) {
        setInventory([
          { id: '1', name: 'Mochila', qty: 1, weight: '2kg' },
          { id: '2', name: 'Ração de Viagem', qty: 10, weight: '0.5kg' },
          { id: '3', name: 'Cantil', qty: 1, weight: '1kg' },
        ]);
      }

      // Sync Token Settings defaults
      setTokenSettings(prev => ({
        ...prev,
        displayMode: 'image',
        textDetails: { text: heroName.substring(0, 2).toUpperCase(), backgroundColor: '#333333', textColor: '#ffffff' },
        vision: { ...prev.vision, range: 30, darkvision: ['elfo', 'anao', 'gnomo', 'tiefling', 'meio-orc', 'dragonborn'].includes(selectedRace) ? 18 : 0 }
      }));
    }
  }, [step, selectedRace, selectedClass, attributes, level, editingId]);


  // --- HANDLERS & VALIDATION ---

  const validateStep = (currentStep: number): boolean => {
    if (isManual) return true; // Skip validation in manual mode

    switch (currentStep) {
      case 1: // Origins
        if (!selectedRace) { show({ type: 'warning', message: 'Por favor, selecione uma Espécie.' }); return false; }
        if (!selectedClass) { show({ type: 'warning', message: 'Por favor, selecione uma Classe.' }); return false; }
        if (!selectedBg) { show({ type: 'warning', message: 'Por favor, selecione uma Origem.' }); return false; }
        if (!selectedAlignment) { show({ type: 'warning', message: 'Por favor, defina o Alinhamento.' }); return false; }
        return true;
      case 2: // Attributes
        if (pointsRemaining < 0) {
          show({ type: 'error', message: `Você gastou pontos demais! Remova ${Math.abs(pointsRemaining)} pontos.` });
          return false;
        }
        return true;
      case 3: // Skills
        // Soft validation for skills, optional
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCounterChange = (attr: keyof Attributes, newValue: number) => {
    const currentVal = attributes[attr];
    const change = newValue - currentVal;

    if (isManual) {
      setAttributes({ ...attributes, [attr]: Math.max(1, newValue) }); // Prevent 0 or negative stats
      return;
    }

    if (newValue < 8) {
      show({ type: 'info', message: 'Atributos não podem ser menores que 8 na compra de pontos.' });
      return;
    }
    if (newValue > 15) {
      show({ type: 'info', message: 'Atributos iniciais não podem exceder 15 na compra de pontos.' });
      return;
    }

    const getCost = (val: number) => (val >= 13 ? 2 : 1);
    let cost = change > 0 ? getCost(currentVal) : -getCost(newValue);

    if (pointsRemaining - cost < 0) {
      show({ type: 'warning', message: 'Pontos insuficientes!' });
      return;
    }

    setAttributes({ ...attributes, [attr]: newValue });
    setPointsRemaining(pointsRemaining - cost);
  };

  const toggleSkill = (skill: SkillName) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      if (!isManual && selectedSkills.length >= 4) {
        show({ type: 'warning', message: 'Você já selecionou o máximo de perícias permitidas.' });
        return;
      }
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleAttack = (id: string) => {
    setExpandedAttackId(expandedAttackId === id ? null : id);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!heroName.trim()) {
      show({ type: 'error', title: 'Nome Obrigatório', message: 'Dê um nome ao seu herói antes de salvar!' });
      return;
    }

    setIsLoading(true);

    const safeAttributes = { ...attributes };
    const safeHpMax = Math.max(1, hpMax);

    // Generate Avatar URL if needed
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${heroName}&backgroundColor=b6e3f4`;

    const charData: Omit<Character, 'id' | 'createdAt'> = {
      ownerId: user.id,
      campaignId: campaignId || undefined,
      name: heroName,
      species: (selectedRace as CharacterSpeciesId) || 'humano',
      class: (selectedClass as CharacterClassId) || 'guerreiro',
      level: Math.max(1, level),
      origin: (selectedBg as OriginId) || 'acolyte',
      alignment: (selectedAlignment as AlignmentId) || 'n',
      experience: xp,
      playerName: user.name,
      attributes: safeAttributes,
      skills: selectedSkills,
      personality,
      appearance,
      hpMax: safeHpMax,
      hpCurrent: Math.min(hpCurrent, safeHpMax),
      hpTemp: Math.max(0, hpTemp),
      hitDiceTotal,
      hitDiceCurrent,
      deathSaves,
      exhaustion: 0, // Default 2024
      heroicInspiration: inspiration, // Default 2024
      armorClass,
      speed,
      movementDetails,
      visionRange,
      darkvisionRange,
      initiative,
      profBonus,
      passivePerception,
      armorProficiencies: otherProficiencies,
      // Mapped empty for now
      languages: '',
      toolProficiencies: '',
      weaponProficiencies: '',
      expertise: [],
      attunementSlots: { current: 0, max: 3 },
      activeEffects: [],

      attacks,
      spellInfo,
      spellSlots,
      spells,
      inventory,
      currency,
      treasure,
      features,
      alliesAndOrgs,
      bio: bio || `História de ${heroName}...`,
      notes: '',
      avatarUrl,
      tokenSettings: { ...tokenSettings, imgUrl: tokenSettings.imgUrl || avatarUrl }
    };

    let result;
    if (editingId) {
      result = await characterService.update(editingId, charData);
      if (result.success) {
        show({ type: 'success', title: 'Ficha Atualizada!', message: `${heroName} foi salvo com sucesso.` });
      }
    } else {
      // Create character
      result = await characterService.create(charData);

      if (result.success && result.data) {
        // If we have a campaign ID, link the character to the campaign
        if (campaignId) {
          // First update the character with campaignId (redundant but safe)
          await characterService.update(result.data.id, { campaignId });
          // Then add the player to the campaign
          await campaignService.addPlayer(campaignId, user.id);
        }
        show({ type: 'success', title: 'Ficha Criada!', message: `${heroName} foi registrado nos anais da história.` });
      }
    }

    if (result?.success) {
      // Wait a bit for the toast
      setTimeout(() => {
        if (campaignId) {
          navigateTo('campaign-dashboard', { id: campaignId });
        } else {
          navigateTo('dashboard');
        }
      }, 1000);
    } else {
      show({ type: 'error', message: result?.message || 'Erro ao salvar personagem.' });
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (campaignId) {
      navigateTo('campaign-dashboard', { id: campaignId });
    } else {
      navigateTo('dashboard');
    }
  };

  // --- SHEET TABS RENDER ---

  const renderHeader = () => (
    <div className="bg-card border-b border-border p-4 md:p-6 rounded-t-xl space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1 w-full">
          <SheetInput
            label="Nome do Personagem"
            variant="title"
            value={heroName}
            onChange={e => setHeroName(e.target.value)}
            placeholder="Thorin Escudo de Carvalho"
            tooltip="O nome pelo qual você será conhecido em todas as terras."
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <SheetInput
              label="Classe"
              value={isManual ? selectedClass : CLASSES.find(c => c.id === selectedClass)?.name}
              readOnly={!isManual}
            />
            <SheetInput
              label="Nível"
              type="number"
              className="w-12 text-center"
              value={level}
              onChange={e => setLevel(Math.max(1, Number(e.target.value)))}
              tooltip="Seu nível de poder atual."
            />
          </div>
          <SheetInput
            label="Espécie"
            value={isManual ? selectedRace : RACES.find(r => r.id === selectedRace)?.name}
            readOnly={!isManual}
          />
          <SheetInput
            label="Origem"
            value={isManual ? selectedBg : BACKGROUNDS.find(b => b.id === selectedBg)?.name}
            readOnly={!isManual}
          />
          <SheetInput
            label="XP"
            tooltip={TOOLTIPS.xp}
            value={xp}
            onChange={e => setXp(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );

  const renderTabCore = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
      {/* Stats Column */}
      <div className="md:col-span-3 space-y-4">
        <SheetCard noPadding>
          <div className="p-4 space-y-3 bg-muted/20">
            {(Object.keys(attributes) as Array<keyof Attributes>).map(attr => (
              <div key={attr as string} className="flex items-center justify-between bg-card p-2 rounded border border-border relative overflow-hidden group shadow-sm hover:border-primary/40 transition-colors">
                <div className="text-center w-12">
                  <Tooltip content={TOOLTIPS[attr]} position="right">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block cursor-help hover:text-primary transition-colors mb-1">{attr}</span>
                  </Tooltip>
                  <SheetInput
                    variant="ghost"
                    align="center"
                    type="number"
                    value={attributes[attr]}
                    onChange={e => setAttributes({ ...attributes, [attr]: Math.max(1, Number(e.target.value)) })}
                    className="text-xs font-medium"
                  />
                </div>
                <div className="flex-1 text-center font-bold text-xl font-mono text-foreground">
                  {formatModifier(calculateModifier(attributes[attr]))}
                </div>
              </div>
            ))}
          </div>
        </SheetCard>

        <SheetCard className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-muted-foreground" />
          <div className="flex-1">
            <SheetLabel tooltip={TOOLTIPS.passivePerception}>Percepção Passiva</SheetLabel>
            <SheetInput
              variant="ghost"
              className="text-2xl font-bold"
              type="number"
              value={passivePerception}
              onChange={e => setPassivePerception(Number(e.target.value))}
            />
          </div>
        </SheetCard>
      </div>

      {/* Skills & Proficiencies */}
      <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
        <SheetCard className="flex flex-col h-full">
          <SheetHeader title="Perícias" icon={Brain} />
          <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[450px]">
            {SKILLS_DATA.map(skill => {
              const mod = calculateModifier(attributes[skill.attr]);
              const isProficient = selectedSkills.includes(skill.id);
              const total = mod + (isProficient ? profBonus : 0);
              return (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 text-sm hover:bg-muted/50 p-1.5 rounded transition-colors cursor-pointer"
                  onClick={() => toggleSkill(skill.id)}
                >
                  <Tooltip content={TOOLTIPS.skills} position="left" delay={1000}>
                    <div className={`w-3 h-3 rounded-full border transition-colors ${isProficient ? 'bg-primary border-primary' : 'border-muted-foreground'}`}></div>
                  </Tooltip>
                  <span className="w-8 text-right font-mono text-muted-foreground text-xs">{formatModifier(total)}</span>
                  <span className={`flex-1 ${isProficient ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{skill.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase opacity-50">({skill.attr})</span>
                </div>
              );
            })}
          </div>
        </SheetCard>

        <div className="space-y-6">
          <SheetCard>
            <SheetHeader title="Salvaguardas" icon={Shield} />
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(attributes) as Array<keyof Attributes>).map(attr => (
                <Tooltip key={attr as string} content={`Resistência usando ${attr}`} position="top">
                  <div className="flex items-center gap-3 text-sm p-1 cursor-pointer hover:bg-muted/20 rounded">
                    <input type="checkbox" className="rounded border-input text-primary focus:ring-primary w-4 h-4" />
                    <span className="font-mono text-muted-foreground w-6">{formatModifier(calculateModifier(attributes[attr]))}</span>
                    <span className="uppercase text-xs font-bold text-foreground">{attr}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </SheetCard>

          <SheetCard className="flex-1 flex flex-col">
            <SheetHeader title="Outras Proficiências" />
            <SheetTextArea
              value={otherProficiencies}
              onChange={e => setOtherProficiencies(e.target.value)}
              className="h-40"
              placeholder="Idiomas: Comum, Élfico.&#10;Armaduras: Leves.&#10;Armas: Simples."
            />
          </SheetCard>
        </div>
      </div>
    </div>
  );

  const renderTabCombat = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Vitals Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <SheetStatBlock
          label="Classe Armadura"
          value={armorClass}
          onChange={v => setArmorClass(Number(v))}
          icon={<Shield className="w-4 h-4" />}
          tooltip={TOOLTIPS.ac}
        />
        <SheetStatBlock
          label="Iniciativa"
          value={formatModifier(initiative)}
          onChange={v => setInitiative(Number(v))}
          tooltip={TOOLTIPS.init}
        />
        <SheetStatBlock
          label="Deslocamento (m)"
          value={speed}
          onChange={v => setSpeed(Number(v))}
          tooltip={TOOLTIPS.speed}
        />

        {/* Inspiration Toggle */}
        <Tooltip content={TOOLTIPS.inspiration}>
          <div
            className="bg-card border-2 border-border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all group h-full"
            onClick={() => setInspiration(!inspiration)}
          >
            <div className={`w-6 h-6 rounded-full border-2 mb-1 transition-all duration-300 ${inspiration ? 'bg-primary border-primary scale-110 shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'border-muted-foreground'}`}></div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Inspiração</span>
          </div>
        </Tooltip>

        <SheetStatBlock
          label="Proficiência"
          value={`+${profBonus}`}
          editable={false}
          tooltip={TOOLTIPS.prof}
        />
        <SheetStatBlock
          label="Percepção Passiva"
          value={passivePerception}
          editable={false}
          icon={<Eye className="w-4 h-4" />}
        />
      </div>

      {/* Removed Vision Block from Combat Tab per request */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SheetCard className="md:col-span-3 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <SheetHeader title="Detalhes de Movimento" icon={Wind} className="mb-2" />
            <SheetInput
              placeholder="Ex: Voo 9m, Natação 6m, Escalada..."
              value={movementDetails}
              onChange={e => setMovementDetails(e.target.value)}
              tooltip="Adicione modos de movimento especiais aqui."
            />
          </div>
        </SheetCard>
      </div>

      {/* Health Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SheetCard className="md:col-span-1 flex flex-col justify-between bg-muted/10">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
            <SheetLabel tooltip={TOOLTIPS.hp} icon={<Heart className="w-3 h-3 text-destructive" />}>Pontos de Vida</SheetLabel>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Máx</span>
              <input type="number" value={hpMax} onChange={e => setHpMax(Number(e.target.value))} className="w-12 bg-transparent text-center border-b border-border outline-none font-bold text-sm" />
            </div>
          </div>

          <input
            type="number"
            value={hpCurrent}
            onChange={e => setHpCurrent(Number(e.target.value))}
            className="w-full text-center text-6xl font-bold bg-transparent outline-none text-green-600 dark:text-green-500 py-4 drop-shadow-sm"
          />

          <div className="pt-4 border-t border-border mt-4">
            <SheetLabel className="text-center w-full block text-blue-600 dark:text-blue-400">PV Temporários</SheetLabel>
            <input type="number" value={hpTemp} onChange={e => setHpTemp(Number(e.target.value))} className="w-full text-center text-2xl font-bold bg-transparent outline-none text-blue-600 dark:text-blue-400 placeholder:text-blue-600/20" placeholder="0" />
          </div>
        </SheetCard>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SheetCard>
            <SheetLabel tooltip={TOOLTIPS.hitDice}>Dados de Vida</SheetLabel>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex-1">
                <label className="text-[10px] block text-muted-foreground uppercase mb-1">Total</label>
                <SheetInput value={hitDiceTotal} onChange={e => setHitDiceTotal(e.target.value)} variant="standard" className="text-lg" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] block text-muted-foreground uppercase mb-1">Restantes</label>
                <Counter value={hitDiceCurrent} onChange={setHitDiceCurrent} size="md" max={level} />
              </div>
            </div>
          </SheetCard>

          <SheetCard>
            <SheetLabel tooltip={TOOLTIPS.deathSaves} icon={<Skull className="w-3 h-3" />}>Salvaguarda Contra Morte</SheetLabel>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Sucessos</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <button key={i} onClick={() => setDeathSaves({ ...deathSaves, successes: deathSaves.successes >= i ? i - 1 : i })} className={`w-5 h-5 rounded-full border-2 transition-all ${deathSaves.successes >= i ? 'bg-green-500 border-green-500 scale-110' : 'border-muted-foreground/30 hover:border-green-500/50'}`}></button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Falhas</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <button key={i} onClick={() => setDeathSaves({ ...deathSaves, failures: deathSaves.failures >= i ? i - 1 : i })} className={`w-5 h-5 rounded-full border-2 transition-all ${deathSaves.failures >= i ? 'bg-red-500 border-red-500 scale-110' : 'border-muted-foreground/30 hover:border-red-500/50'}`}></button>
                  ))}
                </div>
              </div>
            </div>
          </SheetCard>
        </div>
      </div>

      {/* Attacks List (Accordion Redesign) */}
      <SheetCard noPadding className="bg-transparent border-none shadow-none">
        <div className="flex justify-between items-center mb-4 px-1">
          <SheetHeader title="Ataques & Conjuração" className="mb-0 pb-0 border-none" icon={Sword} />
          <Tooltip content={TOOLTIPS.addAttack}>
            <Button
              size="sm"
              onClick={() => {
                const newId = Math.random().toString();
                setAttacks([...attacks, {
                  id: newId,
                  name: 'Novo Ataque',
                  atkBonus: '+0',
                  damage: '1d6',
                  type: 'Corte',
                  range: '1.5m',
                  properties: 'Leve',
                  damageMod: '+FOR',
                  critDamage: '2d6',
                  notes: ''
                }]);
                setExpandedAttackId(newId);
                show({ type: 'success', message: 'Slot de ataque adicionado.' });
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Novo Ataque
            </Button>
          </Tooltip>
        </div>

        <div className="space-y-3">
          {attacks.length === 0 && (
            <div className="text-center p-8 bg-card/50 border border-dashed border-border rounded-xl text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum ataque registrado.</p>
            </div>
          )}
          {attacks.map(atk => (
            <div
              key={atk.id}
              className={`
                    bg-card border rounded-lg transition-all duration-300 overflow-hidden group
                    ${expandedAttackId === atk.id ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border hover:border-primary/40 shadow-sm'}
                  `}
            >
              {/* Header / Summary */}
              <div
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => toggleAttack(atk.id)}
              >
                <div className={`p-2 rounded-lg transition-colors ${expandedAttackId === atk.id ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground group-hover:text-primary'}`}>
                  <Crosshair className="w-5 h-5" />
                </div>

                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 md:col-span-4 font-bold text-sm truncate">{atk.name}</div>

                  {/* Desktop Stats */}
                  <div className="hidden md:flex col-span-6 items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-bold text-foreground">{atk.atkBonus}</span>
                      <span>Acerto</span>
                    </div>
                    <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-bold text-foreground">{atk.damage}</span>
                      <span>Dano</span>
                    </div>
                    <span className="italic opacity-70">{atk.type}</span>
                  </div>

                  {/* Mobile Stats (Condensed) */}
                  <div className="md:hidden col-span-5 text-xs text-muted-foreground flex gap-2">
                    <span className="font-bold">{atk.atkBonus}</span> • <span>{atk.damage}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip content="Remover">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttacks(attacks.filter(a => a.id !== atk.id));
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <div className={`transform transition-transform duration-300 ${expandedAttackId === atk.id ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Expanded Editor */}
              {expandedAttackId === atk.id && (
                <div className="p-4 pt-2 border-t border-border/50 bg-muted/5 space-y-4 animate-accordion-down origin-top">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <SheetInput
                        label="Nome do Ataque"
                        value={atk.name}
                        onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, name: e.target.value } : a))}
                        className="font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:col-span-2">
                      <SheetInput
                        label="Bônus Acerto"
                        align="center"
                        value={atk.atkBonus}
                        onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, atkBonus: e.target.value } : a))}
                        placeholder="+0"
                        variant="ghost"
                      />
                      <SheetInput
                        label="Dano Base"
                        align="center"
                        value={atk.damage}
                        onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, damage: e.target.value } : a))}
                        placeholder="1d8"
                        variant="ghost"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SheetSelect
                      label="Tipo de Dano"
                      value={atk.type}
                      onChange={val => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, type: val } : a))}
                      placeholder="Tipo"
                      variant="ghost"
                      options={[...DAMAGE_TYPES]}
                      className="text-xs"
                    />
                    <SheetInput
                      label="Alcance"
                      value={atk.range}
                      onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, range: e.target.value } : a))}
                      placeholder="1.5m"
                      variant="ghost"
                      className="text-xs"
                    />
                    <SheetSelect
                      label="Mod. Dano"
                      value={atk.damageMod || ''}
                      onChange={val => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, damageMod: val } : a))}
                      placeholder="+FOR"
                      variant="ghost"
                      options={[...ATTRIBUTE_OPTIONS]}
                      className="text-xs"
                    />
                    <SheetInput
                      label="Dano Crítico"
                      value={atk.critDamage}
                      onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, critDamage: e.target.value } : a))}
                      placeholder="2d8"
                      variant="ghost"
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <SheetInput
                      label="Propriedades"
                      value={atk.properties}
                      onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, properties: e.target.value } : a))}
                      placeholder="Leve, Acuidade, Arremesso..."
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                    />
                    <div className="space-y-1">
                      <SheetLabel>Notas Adicionais</SheetLabel>
                      <textarea
                        className="w-full bg-muted/20 border border-transparent rounded p-2 text-xs text-muted-foreground focus:bg-background focus:border-primary outline-none transition-all resize-none h-16"
                        placeholder="Efeitos especiais, condições para vantagem, etc."
                        value={atk.notes || ''}
                        onChange={e => setAttacks(attacks.map(a => a.id === atk.id ? { ...a, notes: e.target.value } : a))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetCard>
    </div>
  );

  const renderTabMagic = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Magic Header */}
      <SheetCard className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-muted/10">
        <SheetInput
          label="Classe Conjuradora"
          value={spellInfo.class}
          onChange={e => setSpellInfo({ ...spellInfo, class: e.target.value })}
          className="font-bold"
        />
        <SheetSelect
          label="Atributo Chave"
          value={spellInfo.ability}
          onChange={val => setSpellInfo({ ...spellInfo, ability: val })}
          className="uppercase font-bold"
          options={[
            { label: 'INT', value: 'int' },
            { label: 'WIS', value: 'wis' },
            { label: 'CHA', value: 'cha' }
          ]}
        />

        <SheetStatBlock
          label="CD de Magia"
          value={spellInfo.saveDc}
          onChange={v => setSpellInfo({ ...spellInfo, saveDc: Number(v) })}
          tooltip={TOOLTIPS.spellDC}
          className="bg-background border-primary/20"
        />
        <SheetStatBlock
          label="Bônus de Ataque"
          value={spellInfo.atkBonus}
          onChange={v => setSpellInfo({ ...spellInfo, atkBonus: Number(v) })}
          tooltip={TOOLTIPS.spellAtk}
          className="bg-background border-primary/20"
        />
      </SheetCard>

      {/* Spell Slots Tracker */}
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => {
          const slot = spellSlots.find(s => s.level === lvl) || { level: lvl, total: 0, used: 0 };
          return (
            <SheetCard key={lvl} noPadding className="w-24 flex flex-col items-center p-2 bg-background/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Nível {lvl}</span>
              <div className="flex items-center gap-1 mb-3">
                <input type="number" className="w-10 text-center bg-muted/50 rounded border border-border font-bold text-sm py-1 outline-none focus:border-primary" value={slot.total} onChange={e => {
                  const newSlots = [...spellSlots.filter(s => s.level !== lvl), { ...slot, total: Number(e.target.value) }];
                  setSpellSlots(newSlots.sort((a, b) => a.level - b.level));
                }} />
              </div>
              <div className="flex gap-1.5 flex-wrap justify-center px-1">
                {Array.from({ length: slot.total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const newSlots = [...spellSlots.filter(s => s.level !== lvl), { ...slot, used: slot.used === i + 1 && i === slot.used - 1 ? i : i + 1 }];
                      setSpellSlots(newSlots.sort((a, b) => a.level - b.level));
                    }}
                    className={`w-3 h-3 rounded-full border transition-all ${i < slot.used ? 'bg-primary border-primary shadow-[0_0_5px_rgba(124,58,237,0.5)]' : 'bg-transparent border-muted-foreground/40 hover:border-primary/50'}`}
                  />
                ))}
              </div>
            </SheetCard>
          );
        })}
      </div>

      {/* Spells List */}
      <SheetCard>
        <SheetHeader
          title="Lista de Magias"
          icon={Scroll}
          action={
            <Tooltip content={TOOLTIPS.addSpell}>
              <Button size="sm" variant="outline" onClick={() => setSpells([...spells, { id: Math.random().toString(), name: '', level: 0, school: '' }])}><Plus className="w-4 h-4" /> Adicionar</Button>
            </Tooltip>
          }
        />
        <div className="space-y-2">
          {spells.sort((a, b) => a.level - b.level).map(spell => (
            <SheetListItem
              key={spell.id}
              actions={
                <button onClick={() => setSpells(spells.filter(s => s.id !== spell.id))} className="text-destructive p-2 hover:bg-destructive/10 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
              }
            >
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 border border-border">
                {spell.level === 0 ? 'T' : spell.level}
              </div>
              <div className="flex-1 space-y-0.5">
                <SheetInput variant="ghost" className="font-bold text-sm" placeholder="Nome da Magia" value={spell.name} onChange={e => setSpells(spells.map(s => s.id === spell.id ? { ...s, name: e.target.value } : s))} />
                <div className="w-full">
                  <SheetSelect
                    variant="ghost"
                    options={[...SPELL_SCHOOLS]}
                    className="text-xs text-muted-foreground h-6 py-0"
                    placeholder="Escola"
                    value={spell.school || ''}
                    onChange={val => setSpells(spells.map(s => s.id === spell.id ? { ...s, school: val } : s))}
                  />
                </div>
              </div>
            </SheetListItem>
          ))}
        </div>
      </SheetCard>

      {/* Features List */}
      <SheetCard>
        <SheetHeader
          title="Características & Talentos"
          icon={Zap}
          action={
            <Tooltip content={TOOLTIPS.addFeature}>
              <Button size="sm" variant="outline" onClick={() => setFeatures([...features, { id: Math.random().toString(), name: '', source: 'class', description: '' }])}><Plus className="w-4 h-4" /> Adicionar</Button>
            </Tooltip>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(feat => (
            <div key={feat.id} className="border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-all bg-card relative group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  <Zap className="w-4 h-4" />
                </div>
                <SheetInput
                  variant="ghost"
                  className="font-bold text-base"
                  placeholder="Nome da Habilidade"
                  value={feat.name}
                  onChange={e => setFeatures(features.map(f => f.id === feat.id ? { ...f, name: e.target.value } : f))}
                />
              </div>

              <div className="flex gap-3">
                <div className="w-24">
                  <SheetSelect
                    value={feat.source}
                    onChange={val => setFeatures(features.map(f => f.id === feat.id ? { ...f, source: val as any } : f))}
                    className="text-xs uppercase font-bold text-muted-foreground"
                    options={[
                      { label: 'Classe', value: 'class' },
                      { label: 'Raça', value: 'race' },
                      { label: 'Talento', value: 'feat' },
                      { label: 'Outro', value: 'other' },
                    ]}
                  />
                </div>
                <SheetInput
                  variant="ghost"
                  className="text-xs"
                  placeholder="Custo (ex: 1 Ação)"
                  value={feat.cost || ''}
                  onChange={e => setFeatures(features.map(f => f.id === feat.id ? { ...f, cost: e.target.value } : f))}
                />
                <SheetInput
                  variant="ghost"
                  className="text-xs"
                  placeholder="Recarga"
                  value={feat.cooldown || ''}
                  onChange={e => setFeatures(features.map(f => f.id === feat.id ? { ...f, cooldown: e.target.value } : f))}
                />
              </div>

              <SheetTextArea
                className="min-h-[80px] text-muted-foreground text-xs bg-muted/20 border-transparent"
                placeholder="Descrição detalhada..."
                value={feat.description}
                onChange={e => setFeatures(features.map(f => f.id === feat.id ? { ...f, description: e.target.value } : f))}
              />

              <button
                onClick={() => setFeatures(features.filter(f => f.id !== feat.id))}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </SheetCard>
    </div>
  );

  const renderTabInventory = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Currency */}
      <SheetCard>
        <SheetHeader title="Tesouro" icon={Crown} className="mb-4" />
        <div className="grid grid-cols-5 gap-4">
          {(['cp', 'pp', 'ep', 'gp', 'sp'] as const).map((key, idx) => {
            const label = ['pc', 'pl', 'pe', 'po', 'pp'][idx];
            return (
              <div key={key as string} className="flex flex-col items-center gap-2 p-2 rounded bg-muted/20 border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
                <Counter
                  value={currency[key]}
                  onChange={val => setCurrency({ ...currency, [key]: val })}
                  size="sm"
                  className="w-full max-w-[100px]"
                />
              </div>
            );
          })}
        </div>
      </SheetCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <SheetCard className="flex flex-col">
          <SheetHeader
            title="Equipamento"
            icon={Backpack}
            action={
              <Tooltip content={TOOLTIPS.addItem}>
                <Button size="sm" variant="ghost" onClick={() => setInventory([...inventory, { id: Math.random().toString(), name: 'Novo Item', qty: 1 }])}><Plus className="w-4 h-4" /></Button>
              </Tooltip>
            }
          />
          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar max-h-[400px] pr-2">
            {inventory.map(item => (
              <SheetListItem
                key={item.id}
                actions={
                  <Tooltip content="Jogar fora">
                    <button onClick={() => setInventory(inventory.filter(i => i.id !== item.id))} className="text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-destructive/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </Tooltip>
                }
              >
                <div className="w-32 shrink-0 pt-1">
                  <Counter
                    value={item.qty}
                    onChange={v => setInventory(inventory.map(i => i.id === item.id ? { ...i, qty: v } : i))}
                    size="sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <SheetInput variant="ghost" className="font-bold text-sm" value={item.name} onChange={e => setInventory(inventory.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} placeholder="Nome do Item" />
                  <SheetInput variant="ghost" className="text-xs text-muted-foreground h-6" value={item.weight} onChange={e => setInventory(inventory.map(i => i.id === item.id ? { ...i, weight: e.target.value } : i))} placeholder="Peso (ex: 2kg)" />
                </div>
              </SheetListItem>
            ))}
          </div>
        </SheetCard>

        {/* Treasure Notes */}
        <SheetCard className="flex flex-col">
          <SheetHeader title="Notas de Itens" icon={Scroll} />
          <SheetTextArea
            className="flex-1 min-h-[300px]"
            placeholder="Lista de gemas, obras de arte e itens mágicos..."
            value={treasure}
            onChange={e => setTreasure(e.target.value)}
          />
        </SheetCard>
      </div>
    </div>
  );

  const renderTabBio = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Appearance */}
      <SheetCard>
        <SheetHeader title="Aparência" icon={User} />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          <SheetInput label="Idade" value={appearance.age} onChange={e => setAppearance({ ...appearance, age: e.target.value })} />
          <SheetInput label="Altura" value={appearance.height} onChange={e => setAppearance({ ...appearance, height: e.target.value })} />
          <SheetInput label="Peso" value={appearance.weight} onChange={e => setAppearance({ ...appearance, weight: e.target.value })} />
          <SheetInput label="Olhos" value={appearance.eyes} onChange={e => setAppearance({ ...appearance, eyes: e.target.value })} />
          <SheetInput label="Pele" value={appearance.skin} onChange={e => setAppearance({ ...appearance, skin: e.target.value })} />
          <SheetInput label="Cabelo" value={appearance.hair} onChange={e => setAppearance({ ...appearance, hair: e.target.value })} />
        </div>
      </SheetCard>

      {/* Personality Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SheetCard>
            <SheetLabel>Traços de Personalidade</SheetLabel>
            <SheetTextArea className="h-20 border-transparent bg-muted/20 focus:bg-background" value={personality.traits} onChange={e => setPersonality({ ...personality, traits: e.target.value })} />
          </SheetCard>
          <SheetCard>
            <SheetLabel>Ideais</SheetLabel>
            <SheetTextArea className="h-20 border-transparent bg-muted/20 focus:bg-background" value={personality.ideals} onChange={e => setPersonality({ ...personality, ideals: e.target.value })} />
          </SheetCard>
          <SheetCard>
            <SheetLabel>Vínculos</SheetLabel>
            <SheetTextArea className="h-20 border-transparent bg-muted/20 focus:bg-background" value={personality.bonds} onChange={e => setPersonality({ ...personality, bonds: e.target.value })} />
          </SheetCard>
          <SheetCard>
            <SheetLabel>Fraquezas</SheetLabel>
            <SheetTextArea className="h-20 border-transparent bg-muted/20 focus:bg-background" value={personality.flaws} onChange={e => setPersonality({ ...personality, flaws: e.target.value })} />
          </SheetCard>
        </div>

        <div className="space-y-6">
          <SheetCard className="h-96 flex flex-col">
            <SheetHeader title="História do Personagem" icon={Book} />
            <SheetTextArea
              className="flex-1 border-transparent bg-transparent p-0 leading-relaxed text-foreground"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Era uma vez..."
            />
          </SheetCard>
          <SheetCard className="h-64 flex flex-col">
            <SheetHeader title="Aliados & Organizações" icon={User} />
            <SheetTextArea
              className="flex-1 border-transparent bg-transparent p-0 leading-relaxed text-foreground"
              value={alliesAndOrgs}
              onChange={e => setAlliesAndOrgs(e.target.value)}
              placeholder="Guildas, facções e contatos..."
            />
          </SheetCard>
        </div>
      </div>
    </div>
  );

  const renderTabToken = () => {
    // Helpers for Live Preview
    const GRID_PX = 60;
    const displaySize = tokenSettings.size * GRID_PX;
    const scale = Math.min(1, 250 / displaySize);
    const { hex: borderHex } = rgbaToHexAlpha(tokenSettings.border.color);
    const { hex: visionHex, alpha: visionAlpha } = rgbaToHexAlpha(tokenSettings.vision.color);
    const { hex: tintHex, alpha: tintAlpha } = rgbaToHexAlpha(tokenSettings.tint || 'rgba(0,0,0,0)');
    const img = tokenSettings.imgUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${heroName}&backgroundColor=b6e3f4`;

    const { displayMode, textDetails } = tokenSettings;

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full animate-fade-in">
        {/* LEFT: PREVIEW */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <SheetCard className="aspect-square flex items-center justify-center bg-zinc-950/50 border-2 border-dashed border-zinc-800 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '30px 30px', backgroundPosition: 'center' }}></div>

            {/* Token Preview Component */}
            <div className="relative flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
              {/* Light Preview */}
              {tokenSettings.light.enabled && (
                <div className="absolute rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ width: `${tokenSettings.light.dimRadius * 10 * scale}px`, height: `${tokenSettings.light.dimRadius * 10 * scale}px`, background: `radial-gradient(circle, ${tokenSettings.light.color} 0%, transparent 70%)`, opacity: tokenSettings.light.intensity }}></div>
              )}
              {/* Token Body */}
              <div className="relative shadow-2xl transition-all duration-300" style={{ width: `${displaySize}px`, height: `${displaySize}px`, transform: `scale(${scale})` }}>
                <div className="w-full h-full overflow-hidden relative flex items-center justify-center shadow-2xl" style={{
                  borderRadius: tokenSettings.shape === 'circle' ? '50%' : tokenSettings.shape === 'square' ? '8px' : '0',
                  clipPath: tokenSettings.shape === 'hex' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
                  border: tokenSettings.shape !== 'hex' ? `${tokenSettings.border.width}px solid ${tokenSettings.border.color}` : undefined,
                  backgroundColor: displayMode === 'text' ? textDetails?.backgroundColor || '#333' : '#18181b'
                }}>
                  {displayMode === 'text' ? (
                    <span style={{
                      color: textDetails?.textColor || '#fff',
                      fontSize: `${displaySize * 0.4}px`,
                      fontWeight: 'bold'
                    }}>
                      {textDetails?.text || '?'}
                    </span>
                  ) : (
                    <><img src={img} className="w-full h-full object-cover" alt="Token Preview" />
                      {tintAlpha > 0 && <div className="absolute inset-0" style={{ backgroundColor: tintHex, opacity: tintAlpha }}></div>}</>
                  )}
                </div>
                {tokenSettings.shape === 'hex' && <div className="absolute inset-0 pointer-events-none" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: tokenSettings.border.color, zIndex: -1, transform: `scale(${1 + (tokenSettings.border.width * 0.01)})` }}></div>}
              </div>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded backdrop-blur-md">Preview</span>
            </div>
          </SheetCard>

          <div className="space-y-2">
            <div className="flex p-1 bg-muted rounded-lg border border-border">
              <button onClick={() => setTokenSettings({ ...tokenSettings, displayMode: 'image' })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-all ${displayMode === 'image' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><ImageIcon className="w-4 h-4" /> Imagem</button>
              <button onClick={() => setTokenSettings({ ...tokenSettings, displayMode: 'text' })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-all ${displayMode === 'text' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Type className="w-4 h-4" /> Texto</button>
            </div>

            {displayMode === 'image' ? (
              <div className="space-y-2">
                <SheetLabel>URL da Imagem</SheetLabel>
                <div className="flex gap-2">
                  <SheetInput
                    value={tokenSettings.imgUrl || ''}
                    onChange={e => setTokenSettings({ ...tokenSettings, imgUrl: e.target.value })}
                    placeholder="URL (vazio usa Avatar)"
                    className="text-xs"
                  />
                  <Button size="sm" variant="outline"><UploadCloud className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <SheetLabel>Sigla (2 chars)</SheetLabel>
                    <input
                      maxLength={2}
                      value={textDetails?.text || ''}
                      onChange={e => setTokenSettings({ ...tokenSettings, textDetails: { ...tokenSettings.textDetails!, text: e.target.value.toUpperCase() } })}
                      className="w-full h-9 bg-background border border-input rounded px-2 text-center font-bold uppercase outline-none focus:border-primary"
                      placeholder={heroName.substring(0, 2).toUpperCase()}
                    />
                  </div>
                  <div><SheetLabel>Cor do Texto</SheetLabel><ColorPicker value={textDetails?.textColor || '#ffffff'} onChange={c => setTokenSettings({ ...tokenSettings, textDetails: { ...tokenSettings.textDetails!, textColor: c } })} className="w-full" /></div>
                </div>
                <div><SheetLabel>Cor de Fundo</SheetLabel><ColorPicker value={textDetails?.backgroundColor || '#333333'} onChange={c => setTokenSettings({ ...tokenSettings, textDetails: { ...tokenSettings.textDetails!, backgroundColor: c } })} className="w-full" /></div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SETTINGS */}
        <div className="md:col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-2">
          {/* Appearance */}
          <SheetCard>
            <SheetHeader title="Aparência" icon={ScanEye} />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <SheetLabel>Formato</SheetLabel>
                <div className="flex bg-muted/20 p-1 rounded-lg border border-border">
                  {[{ id: 'circle', icon: <Circle className="w-4 h-4" /> }, { id: 'square', icon: <Square className="w-4 h-4" /> }, { id: 'hex', icon: <Hexagon className="w-4 h-4" /> }].map(s => (
                    <button
                      key={s.id as string}
                      onClick={() => setTokenSettings({ ...tokenSettings, shape: s.id as TokenShape })}
                      className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${tokenSettings.shape === s.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <SheetLabel>Tamanho (Quadrados)</SheetLabel>
                <Counter value={tokenSettings.size} onChange={v => setTokenSettings({ ...tokenSettings, size: v })} min={0.5} max={10} step={0.5} className="w-full" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center"><SheetLabel>Cor da Borda</SheetLabel> <ColorPicker value={borderHex} onChange={c => setTokenSettings({ ...tokenSettings, border: { ...tokenSettings.border, color: c } })} /></div>
                <input type="range" min="0" max="10" value={tokenSettings.border.width} onChange={e => setTokenSettings({ ...tokenSettings, border: { ...tokenSettings.border, width: Number(e.target.value) } })} className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" />
              </div>
              {displayMode === 'image' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><SheetLabel>Tintura</SheetLabel> <ColorPicker value={tintHex} onChange={c => setTokenSettings({ ...tokenSettings, tint: hexAlphaToRgba(c, tintAlpha) })} /></div>
                  <input type="range" min="0" max="1" step="0.1" value={tintAlpha} onChange={e => setTokenSettings({ ...tokenSettings, tint: hexAlphaToRgba(tintHex, Number(e.target.value)) })} className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" />
                </div>
              )}
            </div>
          </SheetCard>

          {/* Vision */}
          <SheetCard>
            <SheetHeader title="Visão & Sentidos" icon={Eye} />
            <div className="grid grid-cols-2 gap-6">
              <SheetInput
                label="Alcance Normal (m)"
                type="number"
                value={visionRange}
                onChange={e => {
                  const val = Number(e.target.value);
                  setVisionRange(val);
                  setTokenSettings({ ...tokenSettings, vision: { ...tokenSettings.vision, range: val } });
                }}
              />
              <SheetInput
                label="Visão no Escuro (m)"
                type="number"
                value={darkvisionRange}
                onChange={e => {
                  const val = Number(e.target.value);
                  setDarkvisionRange(val);
                  setTokenSettings({ ...tokenSettings, vision: { ...tokenSettings.vision, darkvision: val } });
                }}
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <SheetLabel>Cor da Visão (GM Overlay)</SheetLabel>
                <div className="flex gap-3 items-center">
                  <ColorPicker value={visionHex} onChange={c => setTokenSettings({ ...tokenSettings, vision: { ...tokenSettings.vision, color: hexAlphaToRgba(c, visionAlpha) } })} />
                  <div className="flex-1 px-2 h-10 border border-border rounded flex items-center bg-muted/10">
                    <input type="range" min="0" max="1" step="0.1" value={visionAlpha} onChange={e => setTokenSettings({ ...tokenSettings, vision: { ...tokenSettings.vision, color: hexAlphaToRgba(visionHex, Number(e.target.value)) } })} className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </SheetCard>

          {/* Light */}
          <SheetCard>
            <div className="flex items-center justify-between mb-4">
              <SheetHeader title="Fonte de Luz" icon={Lightbulb} className="mb-0 border-none" />
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-muted-foreground">{tokenSettings.light.enabled ? 'Ligado' : 'Desligado'}</span>
                <button type="button" onClick={() => setTokenSettings({ ...tokenSettings, light: { ...tokenSettings.light, enabled: !tokenSettings.light.enabled } })} className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${tokenSettings.light.enabled ? 'bg-primary' : 'bg-muted'}`}><div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${tokenSettings.light.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div></button>
              </div>
            </div>

            {tokenSettings.light.enabled && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-6">
                  <SheetInput label="Raio Brilhante (m)" type="number" value={tokenSettings.light.brightRadius} onChange={e => setTokenSettings({ ...tokenSettings, light: { ...tokenSettings.light, brightRadius: Number(e.target.value) } })} />
                  <SheetInput label="Raio Penumbra (m)" type="number" value={tokenSettings.light.dimRadius} onChange={e => setTokenSettings({ ...tokenSettings, light: { ...tokenSettings.light, dimRadius: Number(e.target.value) } })} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <SheetLabel>Cor da Luz</SheetLabel>
                    <ColorPicker value={tokenSettings.light.color || '#fbbf24'} onChange={c => setTokenSettings({ ...tokenSettings, light: { ...tokenSettings.light, color: c } })} className="w-full" />
                  </div>
                  <div>
                    <SheetLabel>Animação</SheetLabel>
                    <SheetSelect
                      value={tokenSettings.light.animation || 'none'}
                      onChange={val => setTokenSettings({ ...tokenSettings, light: { ...tokenSettings.light, animation: val as LightAnimationType } })}
                      options={[{ label: 'Fixo', value: 'none' }, { label: 'Tocha', value: 'torch' }, { label: 'Pulso', value: 'pulse' }]}
                    />
                  </div>
                </div>
                <div>
                  <SheetLabel>Intensidade ({Math.round((tokenSettings.light.intensity || 0.5) * 100)}%)</SheetLabel>
                  <input type="range" min="0" max="1" step="0.05" value={tokenSettings.light.intensity} onChange={e => setTokenSettings({ ...tokenSettings, light: { ...tokenSettings.light, intensity: Number(e.target.value) } })} className="w-full accent-yellow-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer mt-2" />
                </div>
              </div>
            )}
          </SheetCard>
        </div>
      </div>
    );
  };

  // --- MAIN NAVIGATION WRAPPER (Steps 1-4 same as before) ---

  const renderStep1_Origins = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-fantasy text-primary">
          {isManual ? 'Origens (Customizado)' : 'Origens & Vocação'}
        </h2>
        <p className="text-muted-foreground">Defina a essência do seu personagem.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" /> Raça
            </h3>
            {isManual ? (
              <Input placeholder="Ex: Vampiro..." value={selectedRace} onChange={e => setSelectedRace(e.target.value)} className="bg-card" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {RACES.map((race) => (
                  <button key={race.id} onClick={() => setSelectedRace(race.id)} className={`p-2 text-sm rounded border transition-all ${selectedRace === race.id ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/50'}`}>
                    {race.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Book className="w-4 h-4" /> Antecedente</h3>
            {isManual ? (
              <Input placeholder="Ex: Caçador..." value={selectedBg} onChange={e => setSelectedBg(e.target.value)} className="bg-card" />
            ) : (
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedBg || ''} onChange={(e) => setSelectedBg(e.target.value)}>
                <option value="" disabled>Selecione...</option>
                {BACKGROUNDS.map(bg => <option key={bg.id} value={bg.id}>{bg.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Gavel className="w-4 h-4" /> Alinhamento</h3>
            {isManual ? (
              <Input placeholder="Ex: Caótico..." value={selectedAlignment} onChange={e => setSelectedAlignment(e.target.value)} className="bg-card" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {ALIGNMENTS.map((align) => (
                  <button key={align.id} onClick={() => setSelectedAlignment(align.id)} className={`p-2 text-xs rounded border transition-all ${selectedAlignment === align.id ? 'border-primary bg-primary/10 font-bold ring-2 ring-primary/20' : 'bg-card border-border hover:bg-accent'}`}>
                    {align.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Sword className="w-4 h-4" /> Classe</h3>
          {isManual ? (
            <Input label="Classe" placeholder="Ex: Necromante..." value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-card" />
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {CLASSES.map((cls) => (
                <div key={cls.id} onClick={() => setSelectedClass(cls.id)} className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-4 transition-all ${selectedClass === cls.id ? `${cls.color} ring-2 ring-primary/20` : 'border-border bg-card hover:bg-accent'}`}>
                  <div className="p-2 bg-white/20 rounded-full">
                    {ICON_MAP[cls.id] || <User className="w-6 h-6" />}
                  </div>
                  <div><div className="font-bold">{cls.name}</div><div className="text-xs opacity-80">{cls.desc}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2_Attributes = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-fantasy text-primary">Atributos</h2>
        <p className="text-muted-foreground">{isManual ? 'Insira valores manuais.' : 'Distribua 27 pontos.'}</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl mx-auto shadow-sm">
        {!isManual && (
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
            <span className="font-bold">Pontos Restantes</span>
            <div className={`text-3xl font-fantasy animate-pulse ${pointsRemaining < 0 ? 'text-destructive' : 'text-primary'}`}>{pointsRemaining}</div>
          </div>
        )}
        <div className="space-y-4">
          {(Object.keys(attributes) as Array<keyof Attributes>).map((attr) => (
            <div key={attr as string} className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3 w-24">
                <Tooltip content={TOOLTIPS[attr]} position="right">
                  <span className="font-bold uppercase text-sm cursor-help hover:text-primary underline decoration-dotted underline-offset-4">{attr}</span>
                </Tooltip>
              </div>
              <div className="flex items-center gap-3">
                <Counter
                  value={attributes[attr]}
                  onChange={(val) => handleCounterChange(attr, val)}
                  disabled={!isManual && pointsRemaining <= 0 && attributes[attr] < 15}
                />
              </div>
              <div className="w-12 text-right"><span className={`font-mono font-bold text-sm ${calculateModifier(attributes[attr]) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatModifier(calculateModifier(attributes[attr]))}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3_Proficiencies = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center"><h2 className="text-2xl font-fantasy text-primary">Perícias</h2><p className="text-muted-foreground">{isManual ? 'Seleção livre.' : 'Escolha 4 talentos.'}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {SKILLS_DATA.map(skill => (
          <button key={skill.id} onClick={() => toggleSkill(skill.id)} className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${selectedSkills.includes(skill.id) ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30' : 'border-border bg-card hover:border-primary/30 hover:bg-accent'}`}>
            <span>{skill.name}</span><span className="text-[10px] uppercase opacity-50 bg-muted px-1 rounded">{skill.attr}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4_Persona = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center"><h2 className="text-2xl font-fantasy text-primary">Personalidade</h2><p className="text-muted-foreground">O que move seu personagem?</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="space-y-2"><label className="text-sm font-bold">Traços</label><textarea className="w-full p-3 rounded-md border bg-background text-sm h-24" value={personality.traits} onChange={e => setPersonality({ ...personality, traits: e.target.value })} /></div>
        <div className="space-y-2"><label className="text-sm font-bold">Ideais</label><textarea className="w-full p-3 rounded-md border bg-background text-sm h-24" value={personality.ideals} onChange={e => setPersonality({ ...personality, ideals: e.target.value })} /></div>
        <div className="space-y-2"><label className="text-sm font-bold">Vínculos</label><textarea className="w-full p-3 rounded-md border bg-background text-sm h-24" value={personality.bonds} onChange={e => setPersonality({ ...personality, bonds: e.target.value })} /></div>
        <div className="space-y-2"><label className="text-sm font-bold">Fraquezas</label><textarea className="w-full p-3 rounded-md border bg-background text-sm h-24" value={personality.flaws} onChange={e => setPersonality({ ...personality, flaws: e.target.value })} /></div>
      </div>
    </div>
  );

  // --- FINAL RENDER ---

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <button onClick={handleBack} className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors hover:underline"><ChevronLeft className="w-4 h-4" /> Voltar</button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><Dice5 className="w-6 h-6 text-primary animate-spin-slow" /><span className="font-fantasy font-bold text-lg hidden sm:inline">{editingId ? 'Editar Herói' : 'Criador de Heróis'}</span></div>
          <Tooltip content={isManual ? TOOLTIPS.manualMode : TOOLTIPS.guidedMode}>
            <button onClick={() => setIsManual(!isManual)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isManual ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'}`}>
              {isManual ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />} {isManual ? 'Modo Livre' : 'Modo Guiado'}
            </button>
          </Tooltip>
        </div>
        <div className="text-sm font-bold text-primary">Passo {step}/5</div>
      </header>

      {step < 5 && (
        <div className="w-full bg-muted h-1.5 relative">
          <div className={`h-full transition-all duration-500 ease-out absolute top-0 left-0 ${isManual ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      )}

      <main className="flex-1 container max-w-full p-0 md:p-6 flex flex-col justify-start md:justify-center overflow-hidden">
        {step === 5 ? (
          // --- STEP 5: FULL SHEET EDITOR ---
          <div className="w-full max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] min-h-[600px] bg-card/50 rounded-xl shadow-2xl border border-border/50 backdrop-blur-sm overflow-hidden">
            {renderHeader()}

            {/* Navigation Tabs */}
            <div className="bg-muted/30 border-b border-border px-4 md:px-6 flex gap-4 overflow-x-auto custom-scrollbar">
              {[
                { id: 'core', label: 'Principal', icon: <User className="w-4 h-4" /> },
                { id: 'combat', label: 'Combate', icon: <Sword className="w-4 h-4" /> },
                { id: 'magic', label: 'Magia', icon: <Wand2 className="w-4 h-4" /> },
                { id: 'inventory', label: 'Inventário', icon: <Backpack className="w-4 h-4" /> },
                { id: 'bio', label: 'Biografia', icon: <Book className="w-4 h-4" /> },
                { id: 'token', label: 'Token', icon: <ScanEye className="w-4 h-4" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-background/50 custom-scrollbar">
              {activeTab === 'core' && renderTabCore()}
              {activeTab === 'combat' && renderTabCombat()}
              {activeTab === 'magic' && renderTabMagic()}
              {activeTab === 'inventory' && renderTabInventory()}
              {activeTab === 'bio' && renderTabBio()}
              {activeTab === 'token' && renderTabToken()}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-border bg-card flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setStep(4)}>Voltar à Criação</Button>
              <Button onClick={handleSave} isLoading={isLoading} className="w-40">
                <Save className="w-4 h-4 mr-2" /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          // --- WIZARD STEPS ---
          <div className="h-full overflow-y-auto px-4 pb-20 md:pb-0 custom-scrollbar">
            <div className="max-w-4xl mx-auto py-8">
              {step === 1 && renderStep1_Origins()}
              {step === 2 && renderStep2_Attributes()}
              {step === 3 && renderStep3_Proficiencies()}
              {step === 4 && renderStep4_Persona()}
            </div>
          </div>
        )}
      </main>

      {step < 5 && (
        <footer className="bg-card border-t border-border p-4 md:p-6 sticky bottom-0 z-50">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : handleBack()} className="w-32">{step === 1 ? 'Cancelar' : 'Voltar'}</Button>
            <Button onClick={handleNextStep} className="w-32 shadow-lg shadow-primary/20">Próximo <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </footer>
      )}
    </div>
  );
};
