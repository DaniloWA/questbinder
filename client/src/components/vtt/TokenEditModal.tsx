
import React, { useState, useRef, useEffect } from 'react';
import { Token, TokenShape, LightAnimationType, TokenType, LightConfig, User, Character, Condition, TokenIdleAnimation, TokenEffect, BorderStyle, TokenStats, CombatEffect } from '../../types';
import { Button } from '../ui/Button';
import { SheetInput, SheetLabel, SheetSelect, SheetTextArea } from '../ui/SheetPrimitives';
import { Counter } from '../ui/Counter';
import { UploadCloud, Eye, RotateCw, Heart, Zap, Shield, Activity, Circle, Square, Hexagon, Skull, AlertTriangle, Droplets, ScanEye, Image as ImageIcon, EyeOff, Type, Sun, Lightbulb, Moon, User as UserIcon, Ghost, Box, Lock, Check, BookOpen, Search, Palette, Wand2, ArrowDownUp, FileText, Flame, Package, Move, Hand, Anchor, EarOff, Loader2, Trash2 } from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';
import { compendiumService } from '../../services/compendiumService';
import { ApiMonster } from '../../types/compendium';
import { ftToM } from '../../utils/dndTranslator';
import { STATUS_RULES } from '../../data/rules';
import { Tooltip } from '../ui/Tooltip';
import { fileService } from '../../services/fileService';
import { useNotification } from '../../context/NotificationContext';
import { AuraSettingsPanel } from './TokenSettings/AuraSettingsPanel';
import { Aura } from '../../types';

type TokenData = Omit<Token, 'id' | 'x' | 'y'>;

interface TokenEditModalProps {
    token: Token | 'new';
    initialPosition?: { x: number, y: number; };
    players: User[];
    availableCharacters?: Character[];
    sceneTokens?: Token[];
    onSave: (data: TokenData, position?: { x: number, y: number; }) => void;
    onSaveTemplate?: (data: TokenData) => void;
    onCancel: () => void;
}

// --- UTILS ---
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

const calcMod = (score: number) => Math.floor((score - 10) / 2);
const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

const CONDITION_ICONS: Record<string, React.ReactNode> = {
    'dead': <Skull className="w-5 h-5" />,
    'bloodied': <Droplets className="w-5 h-5" />,
    'stunned': <Zap className="w-5 h-5" />,
    'shielded': <Shield className="w-5 h-5" />,
    'alert': <AlertTriangle className="w-5 h-5" />,
    'frightened': <Ghost className="w-5 h-5" />,
    'grappled': <Hand className="w-5 h-5" />,
    'prone': <Activity className="w-5 h-5 transform rotate-90" />,
    'blinded': <EyeOff className="w-5 h-5" />,
    'charmed': <Heart className="w-5 h-5" />,
    'poisoned': <Skull className="w-5 h-5" />,
    'restrained': <Anchor className="w-5 h-5" />,
    'incapacitated': <Shield className="w-5 h-5 opacity-50" />,
    'unconscious': <Moon className="w-5 h-5" />,
    'invisible': <Ghost className="w-5 h-5 opacity-50" />,
    'paralyzed': <Zap className="w-5 h-5" />,
    'petrified': <Lock className="w-5 h-5" />,
    'deafened': <EarOff className="w-5 h-5" />,
    'exhausted': <Activity className="w-5 h-5" />,
    'burning': <Flame className="w-5 h-5" />,
    'bleeding': <Droplets className="w-5 h-5" />,
};

const OBJECT_PRESETS: { id: string; label: string; icon: string; light: Partial<LightConfig>; color: string, effect: TokenEffect, animation: TokenIdleAnimation; }[] = [
    { id: 'torch', label: 'Tocha', icon: '🔥', light: { enabled: true, brightRadius: 6, dimRadius: 12, color: '#f97316', intensity: 0.8, animation: 'torch' }, color: '#f97316', effect: 'burning', animation: 'breath' },
    { id: 'lantern', label: 'Lanterna', icon: '🏮', light: { enabled: true, brightRadius: 9, dimRadius: 18, color: '#fbbf24', intensity: 0.7, animation: 'none' }, color: '#fbbf24', effect: 'none', animation: 'none' },
    { id: 'campfire', label: 'Fogueira', icon: '🪵', light: { enabled: true, brightRadius: 4, dimRadius: 9, color: '#ef4444', intensity: 0.9, animation: 'torch' }, color: '#ef4444', effect: 'burning', animation: 'breath' },
    { id: 'magic_orb', label: 'Orbe', icon: '🔮', light: { enabled: true, brightRadius: 3, dimRadius: 6, color: '#8b5cf6', intensity: 0.6, animation: 'pulse' }, color: '#8b5cf6', effect: 'outline', animation: 'float' },
    { id: 'chest', label: 'Baú', icon: '📦', light: { enabled: false }, color: '#a16207', effect: 'none', animation: 'none' },
    { id: 'door', label: 'Porta', icon: '🚪', light: { enabled: false }, color: '#78350f', effect: 'none', animation: 'none' },
    { id: 'trap', label: 'Armadilha', icon: '⚙️', light: { enabled: false }, color: '#52525b', effect: 'none', animation: 'none' },
];

export const TokenEditModal: React.FC<TokenEditModalProps> = ({ token, initialPosition, players, availableCharacters = [], sceneTokens = [], onSave, onSaveTemplate, onCancel }) => {
    const { show } = useNotification();
    const isNew = token === 'new';
    const t = isNew ? {} as Partial<Token> : token;

    const [activeTab, setActiveTab] = useState<string>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ApiMonster[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Identity
    const [tokenType, setTokenType] = useState<TokenType>(t.type || 'npc');
    const [linkedId, setLinkedId] = useState(t.linkedId || '');
    const [controlledBy, setControlledBy] = useState<string[]>(t.controlledBy || []);
    const [name, setName] = useState(t.name || 'Novo Token');
    const [displayMode, setDisplayMode] = useState<'image' | 'text'>(t.displayMode || 'image');
    const [imgUrl, setImgUrl] = useState(t.imgUrl || 'https://api.dicebear.com/7.x/bottts/svg');
    const [textVal, setTextVal] = useState(t.textDetails?.text || '');
    const [textBgColor, setTextBgColor] = useState(t.textDetails?.backgroundColor || '#3f3f46');
    const [textColor, setTextColor] = useState(t.textDetails?.textColor || '#ffffff');

    // Physics
    const [size, setSize] = useState(t.size || 1);
    const [speed, setSpeed] = useState(t.speed || 9);
    const [isVisible, setIsVisible] = useState(isNew ? true : (t.isVisibleToPlayers ?? true));
    const [rotation, setRotation] = useState(t.rotation || 0);

    // Style
    const [shape, setShape] = useState<TokenShape>(t.shape || 'circle');
    const [scale, setScale] = useState(t.scale || 1);
    const [borderColor, setBorderColor] = useState(t.border?.color || '#ffffff');
    const [borderWidth, setBorderWidth] = useState(t.border?.width || 3);
    const [borderStyle, setBorderStyle] = useState<BorderStyle>(t.border?.style || 'solid');
    const [tintColor, setTintColor] = useState(rgbaToHexAlpha(t.tint || 'rgba(0,0,0,0)').hex);
    const [tintAlpha, setTintAlpha] = useState(rgbaToHexAlpha(t.tint || 'rgba(0,0,0,0)').alpha);
    const [idleAnimation, setIdleAnimation] = useState<TokenIdleAnimation>(t.idleAnimation || 'none');
    const [effect, setEffect] = useState<TokenEffect>(t.effect || 'none');

    // Image Positioning
    const [imageX, setImageX] = useState(t.imageX || 0);
    const [imageY, setImageY] = useState(t.imageY || 0);
    const [imageRotation, setImageRotation] = useState(t.imageRotation || 0);

    // Vision
    const [visionRange, setVisionRange] = useState(t.visionRange || 0);
    const [darkvisionRange, setDarkvisionRange] = useState(t.darkvisionRange || 0);
    const initialVisColor = rgbaToHexAlpha(t.visionColor || 'rgba(255, 255, 255, 0.2)');
    const [visionHex, setVisionHex] = useState(initialVisColor.hex);
    const [visionAlpha, setVisionAlpha] = useState(initialVisColor.alpha);

    // Light
    const [lightEnabled, setLightEnabled] = useState(t.light?.enabled || false);
    const [lightBright, setLightBright] = useState(t.light?.brightRadius || 0);
    const [lightDim, setLightDim] = useState(t.light?.dimRadius || 0);
    const [lightColor, setLightColor] = useState(t.light?.color || '#fbbf24');
    const [lightIntensity, setLightIntensity] = useState(t.light?.intensity || 0.5);
    const [lightAnim, setLightAnim] = useState<LightAnimationType>(t.light?.animation || 'none');

    // Stats
    const [hpValue, setHpValue] = useState(t.bars?.bar1?.value || 0);
    const [hpMax, setHpMax] = useState(t.bars?.bar1?.max || 0);
    const [hpVisible, setHpVisible] = useState(t.bars?.bar1?.visible ?? true);
    const [mpValue, setMpValue] = useState(t.bars?.bar2?.value || 0);
    const [mpMax, setMpMax] = useState(t.bars?.bar2?.max || 0);
    const [mpVisible, setMpVisible] = useState(t.bars?.bar2?.visible ?? false);
    const [conditions, setConditions] = useState<Condition[]>(t.conditions || []);
    const [auras, setAuras] = useState<Aura[]>(t.auras || []);
    const [effects, setEffects] = useState<CombatEffect[]>(t.effects || []);
    const [ignoredAuras, setIgnoredAuras] = useState<string[]>(t.ignoredAuras || []);
    const [disposition, setDisposition] = useState<'friendly' | 'neutral' | 'hostile' | undefined>(t.disposition);

    // Monster Sheet (TokenStats)
    const [monsterStats, setMonsterStats] = useState<TokenStats>(t.stats || {
        ac: 10,
        hpFormula: '',
        speed: '9m',
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, cou: 10 },
        alignment: '',
        type: '',
        cr: '',
        senses: '',
        languages: '',
        notes: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- COMPENDIUM SEARCH ---
    useEffect(() => {
        if (tokenType !== 'npc') return; // Only search for NPCs
        const timer = setTimeout(async () => {
            if (searchQuery.length < 3) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await compendiumService.searchMonsters(searchQuery);
                setSearchResults(res.results);
            } catch (e) { console.error(e); }
            setIsSearching(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, tokenType]);

    const applyMonsterStats = (m: ApiMonster) => {
        setName(m.name);
        const dndApiImg = `https://www.dnd5eapi.co/api/images/monsters/${m.slug}.png`;
        setImgUrl(m.img_main || dndApiImg);
        setDisplayMode('image');
        setHpMax(m.hit_points);
        setHpValue(m.hit_points);

        const sizeMap: Record<string, number> = { 'Tiny': 0.5, 'Small': 1, 'Medium': 1, 'Large': 2, 'Huge': 3, 'Gargantuan': 4 };
        setSize(sizeMap[m.size] || 1);

        const walkSpeedFeet = m.speed.walk || 30;
        setSpeed(Math.round(walkSpeedFeet * 0.3 * 10) / 10);

        if (m.senses) {
            const dvMatch = m.senses.match(/darkvision\s+(\d+)\s*ft/i) || m.senses.match(/visão no escuro\s+(\d+)\s*m/i);
            if (dvMatch) {
                const val = parseInt(dvMatch[1]);
                setDarkvisionRange(m.senses.includes('ft') ? Math.round(val * 0.3) : val);
            } else {
                setDarkvisionRange(0);
            }
        } else {
            setDarkvisionRange(0);
        }

        const notesParts = [];
        if (m.special_abilities) notesParts.push(...m.special_abilities.map(a => `**${a.name}.** ${a.desc}`));
        if (m.actions) {
            notesParts.push('### Ações');
            notesParts.push(...m.actions.map(a => `**${a.name}.** ${a.desc}`));
        }
        if (m.legendary_actions) {
            notesParts.push('### Ações Lendárias');
            notesParts.push(...m.legendary_actions.map(a => `**${a.name}.** ${a.desc}`));
        }

        setMonsterStats({
            ac: m.armor_class,
            hpFormula: m.hit_dice,
            speed: Object.entries(m.speed).map(([k, v]) => `${k === 'walk' ? '' : k + ' '}${ftToM(v)}`).join(', '),
            attributes: {
                str: m.strength,
                dex: m.dexterity,
                con: m.constitution,
                int: m.intelligence,
                wis: m.wisdom,
                cha: m.charisma,
                cou: 10
            },
            alignment: m.alignment,
            type: `${m.size} ${m.type}`,
            cr: String(m.challenge_rating),
            senses: m.senses || '',
            languages: m.languages || '',
            notes: notesParts.join('\n\n')
        });

        setSearchQuery('');
        setActiveTab('sheet');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const response = await fileService.upload(file);
            setIsUploading(false);

            if (response.success && response.data) {
                setImgUrl(response.data);
                setDisplayMode('image');
            } else {
                show({ type: 'error', message: response.message || 'Erro no upload da imagem.' });
            }
        }
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!textVal && val.length >= 2) setTextVal(val.substring(0, 2).toUpperCase());
    };

    const handleTypeChange = (newType: TokenType) => {
        setTokenType(newType);
        if (newType === 'object') {
            setHpVisible(false); setMpVisible(false); setVisionRange(0); setDarkvisionRange(0);
            setShape('circle');
            setActiveTab('general');
        } else if (newType === 'pc') {
            setHpVisible(true); setVisionRange(30);
            setActiveTab('general');
        } else if (newType === 'npc') {
            setHpVisible(true);
            setActiveTab('general');
        }
    };

    const handleLinkCharacter = (charId: string) => {
        setLinkedId(charId);
        if (!charId) return;
        const char = availableCharacters.find(c => c.id === charId);
        if (char) {
            setName(char.name);
            if (char.tokenSettings) {
                const ts = char.tokenSettings;
                if (ts.imgUrl) setImgUrl(ts.imgUrl);
                if (ts.displayMode) setDisplayMode(ts.displayMode);
                if (ts.textDetails) { setTextVal(ts.textDetails.text); setTextBgColor(ts.textDetails.backgroundColor); setTextColor(ts.textDetails.textColor); }
                if (ts.shape) setShape(ts.shape);
                if (ts.scale) setScale(ts.scale);
                if (ts.size) setSize(ts.size);
                if (ts.border) { setBorderColor(ts.border.color); setBorderWidth(ts.border.width); setBorderStyle(ts.border.style || 'solid'); }
                if (ts.idleAnimation) setIdleAnimation(ts.idleAnimation);
                if (ts.effect) setEffect(ts.effect);
                if (ts.tint) { const { hex, alpha } = rgbaToHexAlpha(ts.tint); setTintColor(hex); setTintAlpha(alpha); }
                if (ts.vision) { setVisionRange(ts.vision.range); setDarkvisionRange(ts.vision.darkvision); const { hex, alpha } = rgbaToHexAlpha(ts.vision.color); setVisionHex(hex); setVisionAlpha(alpha); }
                if (ts.light) { setLightEnabled(ts.light.enabled); setLightBright(ts.light.brightRadius); setLightDim(ts.light.dimRadius); setLightColor(ts.light.color); setLightIntensity(ts.light.intensity); setLightAnim(ts.light.animation); }
                if (ts.imageX !== undefined) setImageX(ts.imageX);
                if (ts.imageY !== undefined) setImageY(ts.imageY);
                if (ts.imageRotation !== undefined) setImageRotation(ts.imageRotation);
            } else {
                if (char.avatarUrl) { setImgUrl(char.avatarUrl); setDisplayMode('image'); }
                setVisionRange(char.visionRange || 0); setDarkvisionRange(char.darkvisionRange || 0); setBorderColor('#3b82f6');
            }
            setHpMax(char.hpMax); setHpValue(char.hpCurrent); setHpVisible(true); setSpeed(char.speed || 9); setIsVisible(true);
            if (char.ownerId && !controlledBy.includes(char.ownerId)) setControlledBy([...controlledBy, char.ownerId]);
        }
    };

    const handleApplyObjectPreset = (presetId: string) => {
        const preset = OBJECT_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setName(preset.label);
            setDisplayMode('text'); setTextVal(preset.icon); setTextBgColor(preset.color); setTextColor('#ffffff');
            setShape('circle');
            setLightEnabled(!!preset.light.enabled); setLightBright(preset.light.brightRadius || 0); setLightDim(preset.light.dimRadius || 0); setLightColor(preset.light.color || '#ffffff'); setLightIntensity(preset.light.intensity || 0.5); setLightAnim(preset.light.animation || 'none');
            setVisionRange(0); setDarkvisionRange(0);
            setEffect(preset.effect); setIdleAnimation(preset.animation);
        }
    };

    const getData = (): TokenData => {
        const linkedChar = availableCharacters.find(c => c.id === linkedId);
        return {
            type: tokenType,
            linkedId: linkedId || undefined,
            ownerId: linkedChar ? linkedChar.ownerId : t.ownerId,
            controlledBy: controlledBy,
            name, imgUrl, size, speed, isVisibleToPlayers: isVisible, rotation, shape, scale,
            border: { color: borderColor, width: borderWidth, style: borderStyle },
            tint: tintAlpha > 0 ? hexAlphaToRgba(tintColor, tintAlpha) : undefined,
            idleAnimation, effect,
            imageX, imageY, imageRotation,
            visionRange, darkvisionRange, visionColor: hexAlphaToRgba(visionHex, visionAlpha),
            light: { enabled: lightEnabled, brightRadius: lightBright, dimRadius: lightDim, color: lightColor, intensity: lightIntensity, animation: lightAnim },
            displayMode, textDetails: { text: textVal, backgroundColor: textBgColor, textColor: textColor },
            bars: { bar1: { value: hpValue, max: hpMax, color: '#22c55e', visible: hpVisible }, bar2: { value: mpValue, max: mpMax, color: '#3b82f6', visible: mpVisible } },
            conditions,
            auras,
            effects,
            ignoredAuras,
            disposition,
            stats: monsterStats
        };
    };

    const renderPreview = () => {
        const GRID_PX = 50;
        const displaySize = size * GRID_PX;
        const scaleFactor = Math.min(1, 250 / displaySize);

        const animClass = idleAnimation === 'breath' ? 'token-anim-breath' : idleAnimation === 'pulse' ? 'animate-pulse' : idleAnimation === 'spin' ? 'token-anim-spin' : idleAnimation === 'float' ? 'token-anim-float' : idleAnimation === 'wobble' ? 'token-anim-wobble' : '';
        const effectClass = effect === 'ghostly' ? 'token-effect-ghostly' : effect === 'burning' ? 'token-effect-burning' : effect === 'frozen' ? 'token-effect-frozen' : effect === 'glitch' ? 'token-effect-glitch' : effect === 'outline' ? 'token-effect-outline' : '';

        const isTopDown = shape === 'topdown';

        return (
            <div className="relative flex items-center justify-center w-full h-full">
                {lightEnabled && (
                    <div className="absolute rounded-full pointer-events-none mix-blend-screen" style={{ width: `${lightDim * GRID_PX * 2}px`, height: `${lightDim * GRID_PX * 2}px`, background: `radial-gradient(circle, ${lightColor} 0%, transparent 70%)`, opacity: lightIntensity, transform: `scale(${scaleFactor})` }}></div>
                )}
                <div className={`relative transition-all duration-300 ${animClass} ${effectClass}`} style={{ width: `${displaySize}px`, height: `${displaySize}px`, transform: `scale(${scaleFactor}) rotate(${rotation}deg)` }}>
                    <div className="w-full h-full overflow-hidden relative flex items-center justify-center transition-all" style={{
                        borderRadius: !isTopDown ? (shape === 'circle' ? '50%' : shape === 'square' ? '8px' : '0') : undefined,
                        clipPath: shape === 'hex' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
                        border: (!isTopDown && shape !== 'hex') ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
                        boxShadow: !isTopDown ? '0 10px 30px rgba(0,0,0,0.5)' : undefined,
                        backgroundColor: displayMode === 'text' && !isTopDown ? textBgColor : (!isTopDown ? '#18181b' : 'transparent')
                    }}>
                        {displayMode === 'image' ? (
                            <>
                                <div style={{
                                    width: '100%', height: '100%',
                                    transform: `translate(${imageX * 100}%, ${imageY * 100}%) rotate(${imageRotation}deg) scale(${scale})`,
                                    transition: 'transform 0.1s linear'
                                }}>
                                    <img src={imgUrl} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://placehold.co/96x96/333/fff?text=?'} alt="Token Preview" />
                                </div>
                                {tintAlpha > 0 && !isTopDown && <div className="absolute inset-0" style={{ backgroundColor: tintColor, opacity: tintAlpha }}></div>}
                            </>
                        ) : (
                            <span style={{ color: textColor, fontSize: `${displaySize * 0.4}px`, fontWeight: 'bold' }}>{textVal || '?'}</span>
                        )}
                    </div>
                    {shape === 'hex' && <div className="absolute inset-0 pointer-events-none" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: borderColor, zIndex: -1, transform: `scale(${1 + (borderWidth * 0.01)})` }}></div>}
                    {isTopDown && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[20%] border border-[#22d3ee] rounded-[50%] opacity-50" />}
                </div>
            </div>
        );
    };

    const getVisibleTabs = () => {
        if (tokenType === 'pc') return [
            { id: 'general', label: 'Geral', icon: <Eye className="w-4 h-4" /> },
            { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
            { id: 'stats', label: 'Status', icon: <Activity className="w-4 h-4" /> },
            { id: 'light', label: 'Luz', icon: <Sun className="w-4 h-4" /> },
            { id: 'auras', label: 'Auras', icon: <Shield className="w-4 h-4" /> },
            { id: 'perms', label: 'Permissões', icon: <Lock className="w-4 h-4" /> }
        ];
        if (tokenType === 'npc') return [
            { id: 'general', label: 'Geral', icon: <Eye className="w-4 h-4" /> },
            { id: 'sheet', label: 'Ficha', icon: <FileText className="w-4 h-4" /> },
            { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
            { id: 'stats', label: 'Status', icon: <Activity className="w-4 h-4" /> },
            { id: 'light', label: 'Luz', icon: <Sun className="w-4 h-4" /> },
            { id: 'auras', label: 'Auras', icon: <Shield className="w-4 h-4" /> },
            { id: 'perms', label: 'Permissões', icon: <Lock className="w-4 h-4" /> }
        ];
        return [
            { id: 'general', label: 'Geral', icon: <Eye className="w-4 h-4" /> },
            { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
            { id: 'light', label: 'Luz', icon: <Sun className="w-4 h-4" /> },
            { id: 'auras', label: 'Auras', icon: <Shield className="w-4 h-4" /> },
        ];
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(getData(), initialPosition); }} className="flex flex-col h-[85vh] max-h-[750px] min-h-[500px]">
            <div className="px-6 pt-4 pb-2 bg-zinc-950/95 shrink-0">
                <div className="bg-zinc-800/50 p-1 rounded-lg flex gap-1 border border-zinc-800">
                    <button type="button" onClick={() => handleTypeChange('pc')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded transition-all ${tokenType === 'pc' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' : 'text-zinc-500 hover:text-zinc-300'}`}><UserIcon className="w-4 h-4" /> Herói</button>
                    <button type="button" onClick={() => handleTypeChange('npc')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded transition-all ${tokenType === 'npc' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'text-zinc-500 hover:text-zinc-300'}`}><Ghost className="w-4 h-4" /> Criatura</button>
                    <button type="button" onClick={() => handleTypeChange('object')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded transition-all ${tokenType === 'object' ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' : 'text-zinc-500 hover:text-zinc-300'}`}><Box className="w-4 h-4" /> Objeto</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden bg-zinc-950">
                <div className="w-full md:w-5/12 bg-zinc-950 p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col gap-4 overflow-y-auto md:overflow-visible">
                    <div className="w-full h-40 md:h-56 bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-800 relative group overflow-hidden flex items-center justify-center shrink-0">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '50px 50px', backgroundPosition: 'center' }}></div>
                        {renderPreview()}
                        {displayMode === 'image' && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Button type="button" size="sm" variant="secondary" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                                    {isUploading ? 'Enviando...' : 'Upload Imagem'}
                                </Button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="space-y-4">
                        {tokenType === 'pc' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
                                <SheetLabel icon={<Lock className="w-3 h-3" />}>Vincular Ficha de Personagem</SheetLabel>
                                <SheetSelect
                                    value={linkedId}
                                    onChange={handleLinkCharacter}
                                    options={[{ label: 'Sem Vínculo (Token Avulso)', value: '' }, ...availableCharacters.map(p => ({ label: `${p.name} (Nvl ${p.level} ${p.class})`, value: p.id }))]}
                                    placeholder="Selecionar Herói..."
                                    variant="box"
                                />
                                <p className="text-[10px] text-zinc-500">Isso sincroniza automaticamente Nome, Imagem e Visão com a ficha do jogador.</p>
                            </div>
                        )}

                        {tokenType === 'npc' && (
                            <div className="relative z-20 animate-in fade-in slide-in-from-left-4">
                                <SheetLabel icon={<BookOpen className="w-3 h-3" />}>Buscar no Bestiário</SheetLabel>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-primary outline-none placeholder:text-zinc-600"
                                        placeholder="Ex: Goblin, Dragão..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                                </div>
                                {searchResults.length > 0 && searchQuery && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                                        {searchResults.map(m => (
                                            <button
                                                key={m.slug}
                                                type="button"
                                                onClick={() => applyMonsterStats(m)}
                                                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white border-b border-zinc-800 last:border-0 flex justify-between items-center"
                                            >
                                                <span>{m.name}</span>
                                                <span className="text-[10px] text-zinc-500">{m.challenge_rating} CR</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tokenType === 'object' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
                                <SheetLabel icon={<Package className="w-3 h-3" />}>Presets Rápidos</SheetLabel>
                                <div className="grid grid-cols-3 gap-2">
                                    {OBJECT_PRESETS.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handleApplyObjectPreset(preset.id)}
                                            className="flex flex-col items-center justify-center p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-primary/50 hover:bg-zinc-800 transition-all group"
                                        >
                                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{preset.icon}</span>
                                            <span className="text-[10px] font-bold text-zinc-400">{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-zinc-800">
                            <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800 mb-2">
                                <button type="button" onClick={() => setDisplayMode('image')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-all ${displayMode === 'image' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><ImageIcon className="w-4 h-4" /> Imagem</button>
                                <button type="button" onClick={() => setDisplayMode('text')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-all ${displayMode === 'text' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Type className="w-4 h-4" /> Sigla</button>
                            </div>

                            {displayMode === 'image' ? (
                                <SheetInput variant="ghost" className="text-xs bg-zinc-900 border border-zinc-800 rounded-md px-2" placeholder="URL da Imagem..." value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
                            ) : (
                                <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><SheetLabel>Sigla</SheetLabel><input maxLength={2} value={textVal} onChange={e => setTextVal(e.target.value.toUpperCase())} className="w-full h-9 bg-zinc-950 border border-zinc-700 rounded px-2 text-center font-bold uppercase text-white" /></div>
                                        <div><SheetLabel>Cor Texto</SheetLabel><ColorPicker value={textColor} onChange={setTextColor} className="w-full" /></div>
                                    </div>
                                    <div><SheetLabel>Cor Fundo</SheetLabel><ColorPicker value={textBgColor} onChange={setTextBgColor} className="w-full" /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-zinc-900 flex flex-col overflow-hidden">
                    <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-4 overflow-x-auto hide-scrollbar">
                        {getVisibleTabs().map(tab => (
                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>{tab.icon} {tab.label}</button>
                        ))}
                    </div>

                    <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                        {activeTab === 'general' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SheetInput variant="title" placeholder="Nome do Token" value={name} onChange={e => handleNameChange(e.target.value)} className="w-full text-zinc-100" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><SheetLabel>Tamanho (Quadrados)</SheetLabel><Counter value={size} onChange={setSize} min={0.5} max={10} step={0.5} className="bg-zinc-950 w-full" /></div>
                                    {tokenType !== 'object' && (
                                        <div className="space-y-1"><SheetLabel>Movimento (m)</SheetLabel><Counter value={speed} onChange={setSpeed} min={0} max={100} step={1.5} className="bg-zinc-950 w-full" /></div>
                                    )}
                                </div>
                                {tokenType !== 'object' && (
                                    <div className="space-y-2">
                                        <SheetLabel>Disposição (IA)</SheetLabel>
                                        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                                            {([
                                                { id: 'friendly', label: 'Aliado', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/50' },
                                                { id: 'neutral', label: 'Neutro', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' },
                                                { id: 'hostile', label: 'Inimigo', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/50' }
                                            ] as const).map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setDisposition(opt.id)}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all border ${disposition === opt.id ? `${opt.bg} ${opt.color}` : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {tokenType !== 'object' && (
                                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-4">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><ScanEye className="w-3 h-3" /> Visão</h3>
                                        <div className="grid grid-cols-2 gap-4"><div><SheetLabel tooltip="Alcance de visão em área iluminada">Alcance Normal</SheetLabel><Counter value={visionRange} onChange={setVisionRange} min={0} max={999} className="bg-zinc-900 w-full" /></div><div><SheetLabel icon={<Moon className="w-3 h-3" />} tooltip="Alcance de visão no escuro total">Visão Escuro</SheetLabel><Counter value={darkvisionRange} onChange={setDarkvisionRange} min={0} max={999} className="bg-zinc-900 w-full" /></div></div>
                                        <div className="flex-1 space-y-1"><SheetLabel>Cor da Visão (Overlay GM)</SheetLabel><div className="flex gap-2"><ColorPicker value={visionHex} onChange={setVisionHex} /><div className="flex-1 h-10 bg-zinc-900 rounded border border-zinc-700 flex items-center px-2"><input type="range" min="0" max="1" step="0.1" value={visionAlpha} onChange={e => setVisionAlpha(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer" /></div></div></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'sheet' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-3 gap-4">
                                    <SheetInput label="Tipo/Raça" value={monsterStats.type || ''} onChange={e => setMonsterStats({ ...monsterStats, type: e.target.value })} placeholder="Humanoide (Goblin)" variant="box" />
                                    <SheetInput label="Alinhamento" value={monsterStats.alignment || ''} onChange={e => setMonsterStats({ ...monsterStats, alignment: e.target.value })} placeholder="Neutro e Mau" variant="box" />
                                    <SheetInput label="ND (CR)" value={monsterStats.cr || ''} onChange={e => setMonsterStats({ ...monsterStats, cr: e.target.value })} placeholder="1/4" variant="box" />
                                </div>
                                <div className="grid grid-cols-3 gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                                    <div className="space-y-1"><SheetLabel>CA</SheetLabel><input type="number" value={monsterStats.ac} onChange={e => setMonsterStats({ ...monsterStats, ac: Number(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center font-bold" /></div>
                                    <div className="space-y-1"><SheetLabel>PV (Fórmula)</SheetLabel><input value={monsterStats.hpFormula || ''} onChange={e => setMonsterStats({ ...monsterStats, hpFormula: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center text-sm" placeholder="2d6" /></div>
                                    <div className="space-y-1"><SheetLabel>Deslocamento</SheetLabel><input value={monsterStats.speed || ''} onChange={e => setMonsterStats({ ...monsterStats, speed: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center text-sm" placeholder="9m" /></div>
                                </div>
                                <div className="space-y-2"><SheetLabel>Atributos</SheetLabel><div className="grid grid-cols-6 gap-2 bg-zinc-900/30 p-2 rounded border border-zinc-800">{(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(attr => (<div key={attr} className="flex flex-col items-center"><span className="text-[9px] font-bold uppercase text-zinc-500 mb-1">{attr}</span><input type="number" value={monsterStats.attributes[attr]} onChange={e => setMonsterStats({ ...monsterStats, attributes: { ...monsterStats.attributes, [attr]: Number(e.target.value) } })} className="w-full bg-zinc-950 border border-zinc-700 rounded text-center font-bold text-sm p-1 focus:border-primary outline-none" /><span className="text-[9px] text-zinc-600 mt-1 font-mono">{fmtMod(calcMod(monsterStats.attributes[attr]))}</span></div>))}</div></div>
                                <div className="space-y-3"><SheetInput label="Sentidos" value={monsterStats.senses || ''} onChange={e => setMonsterStats({ ...monsterStats, senses: e.target.value })} placeholder="Visão no escuro 18m..." variant="box" className="text-xs" /><SheetInput label="Idiomas" value={monsterStats.languages || ''} onChange={e => setMonsterStats({ ...monsterStats, languages: e.target.value })} placeholder="Comum, Goblin..." variant="box" className="text-xs" /></div>
                                <div className="flex-1 flex flex-col min-h-[150px]"><SheetLabel>Ações e Habilidades</SheetLabel><SheetTextArea value={monsterStats.notes || ''} onChange={e => setMonsterStats({ ...monsterStats, notes: e.target.value })} placeholder="**Cimitarra.** +4 para acertar, 1d6+2 dano cortante..." className="flex-1 font-mono text-xs leading-relaxed bg-zinc-950 border-zinc-800" /></div>
                            </div>
                        )}

                        {activeTab === 'style' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <SheetLabel icon={<Palette className="w-3 h-3" />}>Forma & Borda</SheetLabel>
                                    <div className="grid grid-cols-4 gap-2">{[{ id: 'circle', icon: <Circle className="w-4 h-4" />, label: '' }, { id: 'square', icon: <Square className="w-4 h-4" />, label: '' }, { id: 'hex', icon: <Hexagon className="w-4 h-4" />, label: '' }, { id: 'topdown', icon: <Ghost className="w-4 h-4" />, label: 'PNG' }].map(s => (<button key={s.id} type="button" onClick={() => setShape(s.id as TokenShape)} className={`h-10 flex items-center justify-center rounded-lg border transition-all ${shape === s.id ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'} ${s.id === 'topdown' ? 'text-[10px] font-bold' : ''}`}>{s.icon} {s.label}</button>))}</div>
                                    {shape !== 'topdown' && (<div className="flex items-center gap-3 mt-2"><ColorPicker value={borderColor} onChange={setBorderColor} /><div className="flex-1"><input type="range" min="0" max="10" value={borderWidth} onChange={e => setBorderWidth(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-zinc-800 rounded-lg cursor-pointer" /></div><div className="w-24"><SheetSelect value={borderStyle} onChange={v => setBorderStyle(v as BorderStyle)} options={[{ label: 'Sólido', value: 'solid' }, { label: 'Tracejado', value: 'dashed' }, { label: 'Pontilhado', value: 'dotted' }, { label: 'Duplo', value: 'double' }]} variant="box" className="h-8 text-xs" /></div></div>)}
                                </div>
                                <div className="h-px bg-zinc-800" />
                                <div className="space-y-2">
                                    <SheetLabel icon={<ArrowDownUp className="w-3 h-3" />}>Ajuste de Imagem & Posição</SheetLabel>
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-4">
                                        <div className="flex items-center gap-3"><span className="text-[10px] uppercase font-bold text-zinc-500 w-16">Zoom</span><input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={e => setScale(Number(e.target.value))} className="flex-1 accent-primary h-1.5 bg-zinc-800 rounded-lg cursor-pointer" /></div>
                                        <div className="flex items-center gap-3"><span className="text-[10px] uppercase font-bold text-zinc-500 w-16">Rotação</span><input type="range" min="0" max="360" step="15" value={imageRotation} onChange={e => setImageRotation(Number(e.target.value))} className="flex-1 accent-primary h-1.5 bg-zinc-800 rounded-lg cursor-pointer" /></div>
                                        <div className="flex gap-4"><div className="flex-1 space-y-1"><span className="text-[10px] uppercase font-bold text-zinc-500 block">Pos X</span><input type="range" min="-0.5" max="0.5" step="0.05" value={imageX} onChange={e => setImageX(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer" /></div><div className="flex-1 space-y-1"><span className="text-[10px] uppercase font-bold text-zinc-500 block">Pos Y</span><input type="range" min="-0.5" max="0.5" step="0.05" value={imageY} onChange={e => setImageY(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer" /></div></div>
                                        {displayMode === 'image' && shape !== 'topdown' && (<div className="flex items-center gap-3 pt-2 border-t border-zinc-800/50"><span className="text-[10px] uppercase font-bold text-zinc-500 w-16">Tintura</span><ColorPicker value={tintColor} onChange={setTintColor} /><input type="range" min="0" max="1" step="0.1" value={tintAlpha} onChange={e => setTintAlpha(Number(e.target.value))} className="flex-1 accent-primary h-1.5 bg-zinc-800 rounded-lg cursor-pointer" /></div>)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><SheetLabel icon={<Wand2 className="w-3 h-3" />}>Efeitos Visuais</SheetLabel><SheetSelect value={effect} onChange={v => setEffect(v as TokenEffect)} options={[{ label: 'Nenhum', value: 'none' }, { label: 'Fantasma', value: 'ghostly' }, { label: 'Em Chamas', value: 'burning' }, { label: 'Congelado', value: 'frozen' }, { label: 'Glitch', value: 'glitch' }, { label: 'Outline', value: 'outline' }]} variant="box" /></div><div className="space-y-2"><SheetLabel icon={<Activity className="w-3 h-3" />}>Animação Idle</SheetLabel><SheetSelect value={idleAnimation} onChange={v => setIdleAnimation(v as TokenIdleAnimation)} options={[{ label: 'Estático', value: 'none' }, { label: 'Respirar', value: 'breath' }, { label: 'Flutuar', value: 'float' }, { label: 'Girar', value: 'spin' }, { label: 'Balançar', value: 'wobble' }]} variant="box" /></div></div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4 bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/50">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-2"><Activity className="w-3 h-3" /> Barras de Status</h3>
                                    <div className="space-y-1.5"><div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500"><span className="flex items-center gap-1"><Heart className="w-3 h-3 text-green-500" /> Vida (Barra 1)</span><button type="button" onClick={() => setHpVisible(!hpVisible)} className={`hover:text-white flex items-center gap-1 ${hpVisible ? 'text-green-500' : 'text-zinc-600'}`}>{hpVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}{hpVisible ? 'Pública' : 'Oculta'}</button></div><div className="flex items-center gap-2"><SheetInput type="number" value={hpValue} onChange={e => setHpValue(Number(e.target.value))} className="text-center font-bold text-lg bg-zinc-950 rounded border-zinc-800" placeholder="Atual" /><span className="text-zinc-600">/</span><SheetInput type="number" value={hpMax} onChange={e => setHpMax(Number(e.target.value))} className="text-center font-bold text-lg bg-zinc-950 rounded border-zinc-800 text-zinc-400" placeholder="Máx" /></div></div>
                                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/50 mt-2"><div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500"><span className="flex items-center gap-1"><Zap className="w-3 h-3 text-blue-500" /> Recurso (Barra 2)</span><button type="button" onClick={() => setMpVisible(!mpVisible)} className={`hover:text-white flex items-center gap-1 ${mpVisible ? 'text-blue-500' : 'text-zinc-600'}`}>{mpVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}{mpVisible ? 'Pública' : 'Oculta'}</button></div><div className="flex items-center gap-2"><SheetInput type="number" value={mpValue} onChange={e => setMpValue(Number(e.target.value))} className="text-center font-bold text-lg bg-zinc-950 rounded border-zinc-800" placeholder="Atual" /><span className="text-zinc-600">/</span><SheetInput type="number" value={mpMax} onChange={e => setMpMax(Number(e.target.value))} className="text-center font-bold text-lg bg-zinc-950 rounded border-zinc-800 text-zinc-400" placeholder="Máx" /></div></div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Skull className="w-3 h-3" /> Condições Iniciais</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                        {Object.entries(STATUS_RULES).map(([key, rule]) => {
                                            const isActive = conditions.includes(key);
                                            const icon = CONDITION_ICONS[key] || <Activity className="w-5 h-5" />;
                                            return (
                                                <Tooltip key={key} content={<div className="max-w-[200px]"><div className="font-bold mb-1">{rule.name}</div><ul className="list-disc pl-3 text-xs space-y-1">{rule.effects.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}>
                                                    <button type="button" onClick={() => { if (isActive) setConditions(conditions.filter(c => c !== key)); else setConditions([...conditions, key]); }} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-2 h-20 w-full ${isActive ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(124,58,237,0.3)] scale-105' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 hover:border-zinc-700'}`}>{icon}<span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight line-clamp-2 w-full">{rule.name}</span></button>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Zap className="w-3 h-3" /> Efeitos Ativos</h3>
                                    <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {effects.length === 0 && <span className="text-xs text-zinc-600 italic p-2 block text-center">Nenhum efeito ativo.</span>}
                                        {effects.map(eff => (
                                            <div key={eff.id} className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-8 rounded-full bg-primary/50"></div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white">{eff.name}</div>
                                                        <div className="text-[10px] text-zinc-500 flex gap-2">
                                                            {eff.sourceAuraId && <span className="text-blue-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Aura</span>}
                                                            {eff.duration !== -1 && <span>{typeof eff.duration === 'object' ? `${eff.duration.remaining} rodadas` : `${eff.duration} rodadas`}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newEffects = effects.filter(e => e.id !== eff.id);
                                                        setEffects(newEffects);
                                                        if (eff.sourceAuraId) {
                                                            setIgnoredAuras([...ignoredAuras, eff.sourceAuraId]);
                                                        }
                                                    }}
                                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    title={eff.sourceAuraId ? "Remover e Ignorar Aura" : "Remover Efeito"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'light' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                                    <div className="flex items-center gap-3"><div className={`p-2 rounded-full ${lightEnabled ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-500'}`}><Lightbulb className="w-6 h-6" /></div><div><h3 className="font-bold text-sm text-white">Emissor de Luz</h3><p className="text-xs text-zinc-500">Token ilumina o ambiente?</p></div></div>
                                    <button type="button" onClick={() => setLightEnabled(!lightEnabled)} className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${lightEnabled ? 'bg-primary' : 'bg-zinc-700'}`}><div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${lightEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
                                </div>
                                {lightEnabled && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 fade-in">
                                        <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><SheetLabel>Raio Brilhante</SheetLabel><Counter value={lightBright} onChange={setLightBright} min={0} max={200} className="bg-zinc-950" /></div><div className="space-y-1"><SheetLabel>Raio Penumbra</SheetLabel><Counter value={lightDim} onChange={setLightDim} min={0} max={200} className="bg-zinc-950" /></div></div>
                                        <div className="space-y-2"><SheetLabel>Cor e Intensidade</SheetLabel><div className="flex gap-3 items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800"><ColorPicker value={lightColor} onChange={setLightColor} /><div className="flex-1 px-2"><input type="range" min="0" max="1" step="0.05" value={lightIntensity} onChange={e => setLightIntensity(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500" /></div><span className="text-xs font-bold w-8 text-right">{Math.round(lightIntensity * 100)}%</span></div></div>
                                        <div className="space-y-2"><SheetLabel>Animação da Luz</SheetLabel><div className="grid grid-cols-3 gap-2">{[{ id: 'none', label: 'Fixo' }, { id: 'torch', label: 'Tocha' }, { id: 'pulse', label: 'Pulso' }].map(opt => (<button key={opt.id} type="button" onClick={() => setLightAnim(opt.id as LightAnimationType)} className={`py-2 text-xs font-bold rounded-md border transition-all ${lightAnim === opt.id ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}>{opt.label}</button>))}</div></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'auras' && (
                            <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <AuraSettingsPanel
                                    auras={auras}
                                    onChange={setAuras}
                                    sceneTokens={sceneTokens || []}
                                    parentToken={isNew ? { ...t, ...getData() } as Token : { ...token, ...getData() } as Token}
                                />
                            </div>
                        )}

                        {activeTab === 'perms' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Controladores do Token</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {players.length === 0 && <span className="text-xs text-zinc-600 italic">Nenhum jogador na sessão.</span>}
                                        {players.map(p => {
                                            const isControlled = controlledBy.includes(p.id);
                                            return (
                                                <button key={p.id} type="button" onClick={() => { if (isControlled) setControlledBy(controlledBy.filter(id => id !== p.id)); else setControlledBy([...controlledBy, p.id]); }} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isControlled ? 'bg-primary/10 border-primary/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}><div className="flex items-center gap-3"><img src={p.avatarUrl} className="w-6 h-6 rounded-full bg-zinc-800" /><span className="font-bold text-sm">{p.name}</span></div>{isControlled && <Check className="w-4 h-4 text-primary" />}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center shrink-0 z-10">
                <div>{onSaveTemplate && (<Button type="button" variant="ghost" onClick={() => onSaveTemplate(getData())} className="text-zinc-400 hover:text-white text-xs"><BookOpen className="w-4 h-4 mr-2" /> Salvar no Bestiário</Button>)}</div>
                <div className="flex gap-3"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" className="min-w-[140px] shadow-lg shadow-primary/20" disabled={isUploading}>{isUploading ? 'Carregando...' : 'Salvar Token'}</Button></div>
            </div>
        </form>
    );
};
