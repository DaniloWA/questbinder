import React, { useState, useRef, useEffect } from 'react';
import { Token, TokenShape, LightAnimationType, TokenType, User, Character, Condition, TokenIdleAnimation, TokenEffect, BorderStyle, TokenStats, CombatEffect } from '../../types';
import { Button } from '../ui/Button';
import { SheetInput, SheetLabel, SheetSelect } from '../ui/SheetPrimitives';
import { ColorPicker } from '../ui/ColorPicker';
import { compendiumService } from '../../services/compendiumService';
import { ApiMonster } from '../../types/compendium';
import { ftToM } from '../../utils/unitConversion';
import { fileService } from '../../services/fileService';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../i18n/TranslationContext';
import { Aura } from '../../types';
import { UploadCloud, Eye, Lock, BookOpen, Search, Sun, Activity, Palette, FileText, Shield, Image as ImageIcon, Type, Package, Loader2 } from 'lucide-react';

// Token Settings Components
import { TokenPreviewPanel } from './TokenSettings/TokenPreviewPanel';
import { TokenTypeSelector } from './TokenSettings/TokenTypeSelector';
import { TokenTabNav } from './TokenSettings/TokenTabNav';
import { TokenModalFooter } from './TokenSettings/TokenModalFooter';
import { AuraSettingsPanel } from './TokenSettings/AuraSettingsPanel';
import {
    rgbaToHexAlpha,
    hexAlphaToRgba,
    OBJECT_PRESETS,
    MONSTER_SIZE_MAP,
} from './TokenSettings/tokenModalUtils';

// Tab Components
import { TokenGeneralTab, TokenSheetTab, TokenStyleTab, TokenStatsTab, TokenLightTab, TokenPermsTab } from './TokenSettings/tabs';

type TokenData = Omit<Token, 'id' | 'x' | 'y'>;

interface TokenEditModalProps {
    token: Token | 'new';
    initialPosition?: { x: number; y: number; };
    players: User[];
    availableCharacters?: Character[];
    sceneTokens?: Token[];
    onSave: (data: TokenData, position?: { x: number; y: number; }) => void;
    onSaveTemplate?: (data: TokenData) => void;
    onCancel: () => void;
}

export const TokenEditModal: React.FC<TokenEditModalProps> = ({
    token,
    initialPosition,
    players,
    availableCharacters = [],
    sceneTokens = [],
    onSave,
    onSaveTemplate,
    onCancel,
}) => {
    const { show } = useNotification();
    const { t } = useTranslation();
    const isNew = token === 'new';
    const tokenData = isNew ? ({} as Partial<Token>) : token;

    const [activeTab, setActiveTab] = useState<string>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ApiMonster[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Identity
    const [tokenType, setTokenType] = useState<TokenType>(tokenData.type || 'npc');
    const [linkedId, setLinkedId] = useState(tokenData.linkedId || '');
    const [controlledBy, setControlledBy] = useState<string[]>(tokenData.controlledBy || []);
    const [name, setName] = useState(tokenData.name || t('vtt.tokens.editModal.nameField.placeholder'));
    const [displayMode, setDisplayMode] = useState<'image' | 'text'>(tokenData.displayMode || 'image');
    const [imgUrl, setImgUrl] = useState(tokenData.imgUrl || 'https://api.dicebear.com/7.x/bottts/svg');
    const [textVal, setTextVal] = useState(tokenData.textDetails?.text || '');
    const [textBgColor, setTextBgColor] = useState(tokenData.textDetails?.backgroundColor || '#3f3f46');
    const [textColor, setTextColor] = useState(tokenData.textDetails?.textColor || '#ffffff');

    // Physics
    const [size, setSize] = useState(tokenData.size || 1);
    const [speed, setSpeed] = useState(tokenData.speed || 9);
    const [isVisible, setIsVisible] = useState(isNew ? true : (tokenData.isVisibleToPlayers ?? true));
    const [rotation, setRotation] = useState(tokenData.rotation || 0);

    // Style
    const [shape, setShape] = useState<TokenShape>(tokenData.shape || 'circle');
    const [scale, setScale] = useState(tokenData.scale || 1);
    const [borderColor, setBorderColor] = useState(tokenData.border?.color || '#ffffff');
    const [borderWidth, setBorderWidth] = useState(tokenData.border?.width || 3);
    const [borderStyle, setBorderStyle] = useState<BorderStyle>(tokenData.border?.style || 'solid');
    const [tintColor, setTintColor] = useState(rgbaToHexAlpha(tokenData.tint || 'rgba(0,0,0,0)').hex);
    const [tintAlpha, setTintAlpha] = useState(rgbaToHexAlpha(tokenData.tint || 'rgba(0,0,0,0)').alpha);
    const [idleAnimation, setIdleAnimation] = useState<TokenIdleAnimation>(tokenData.idleAnimation || 'none');
    const [effect, setEffect] = useState<TokenEffect>(tokenData.effect || 'none');

    // Image Positioning
    const [imageX, setImageX] = useState(tokenData.imageX || 0);
    const [imageY, setImageY] = useState(tokenData.imageY || 0);
    const [imageRotation, setImageRotation] = useState(tokenData.imageRotation || 0);

    // Vision
    const [visionRange, setVisionRange] = useState(tokenData.visionRange || 0);
    const [darkvisionRange, setDarkvisionRange] = useState(tokenData.darkvisionRange || 0);
    const initialVisColor = rgbaToHexAlpha(tokenData.visionColor || 'rgba(255, 255, 255, 0.2)');
    const [visionHex, setVisionHex] = useState(initialVisColor.hex);
    const [visionAlpha, setVisionAlpha] = useState(initialVisColor.alpha);

    // Light
    const [lightEnabled, setLightEnabled] = useState(tokenData.light?.enabled || false);
    const [lightBright, setLightBright] = useState(tokenData.light?.brightRadius || 0);
    const [lightDim, setLightDim] = useState(tokenData.light?.dimRadius || 0);
    const [lightColor, setLightColor] = useState(tokenData.light?.color || '#fbbf24');
    const [lightIntensity, setLightIntensity] = useState(tokenData.light?.intensity || 0.5);
    const [lightAnim, setLightAnim] = useState<LightAnimationType>(tokenData.light?.animation || 'none');

    // Stats
    const [hpValue, setHpValue] = useState(tokenData.bars?.bar1?.value || 0);
    const [hpMax, setHpMax] = useState(tokenData.bars?.bar1?.max || 0);
    const [hpVisible, setHpVisible] = useState(tokenData.bars?.bar1?.visible ?? true);
    const [mpValue, setMpValue] = useState(tokenData.bars?.bar2?.value || 0);
    const [mpMax, setMpMax] = useState(tokenData.bars?.bar2?.max || 0);
    const [mpVisible, setMpVisible] = useState(tokenData.bars?.bar2?.visible ?? false);
    const [conditions, setConditions] = useState<Condition[]>(tokenData.conditions || []);
    const [auras, setAuras] = useState<Aura[]>(tokenData.auras || []);
    const [effects, setEffects] = useState<CombatEffect[]>(tokenData.effects || []);
    const [ignoredAuras, setIgnoredAuras] = useState<string[]>(tokenData.ignoredAuras || []);
    const [disposition, setDisposition] = useState<'friendly' | 'neutral' | 'hostile' | undefined>(tokenData.disposition);

    // Monster Sheet
    const [monsterStats, setMonsterStats] = useState<TokenStats>(
        tokenData.stats || {
            ac: 10,
            hpFormula: '',
            speed: '9m',
            attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, cou: 10 },
            alignment: '',
            type: '',
            cr: '',
            senses: '',
            languages: '',
            notes: '',
        }
    );

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Compendium Search ---
    useEffect(() => {
        if (tokenType !== 'npc') return;
        const timer = setTimeout(async () => {
            if (searchQuery.length < 3) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await compendiumService.searchMonsters(searchQuery);
                setSearchResults(res.results);
            } catch (e) {
                console.error(e);
            }
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
        setSize(MONSTER_SIZE_MAP[m.size] || 1);
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
        if (m.special_abilities) notesParts.push(...m.special_abilities.map((a) => `**${a.name}.** ${a.desc}`));
        if (m.actions) {
            notesParts.push('### Ações');
            notesParts.push(...m.actions.map((a) => `**${a.name}.** ${a.desc}`));
        }
        if (m.legendary_actions) {
            notesParts.push('### Ações Lendárias');
            notesParts.push(...m.legendary_actions.map((a) => `**${a.name}.** ${a.desc}`));
        }

        setMonsterStats({
            ac: m.armor_class,
            hpFormula: m.hit_dice,
            speed: Object.entries(m.speed)
                .map(([k, v]) => `${k === 'walk' ? '' : k + ' '}${ftToM(v)}`)
                .join(', '),
            attributes: {
                str: m.strength,
                dex: m.dexterity,
                con: m.constitution,
                int: m.intelligence,
                wis: m.wisdom,
                cha: m.charisma,
                cou: 10,
            },
            alignment: m.alignment,
            type: `${m.size} ${m.type}`,
            cr: String(m.challenge_rating),
            senses: m.senses || '',
            languages: m.languages || '',
            notes: notesParts.join('\n\n'),
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
            setHpVisible(false);
            setMpVisible(false);
            setVisionRange(0);
            setDarkvisionRange(0);
            setShape('circle');
            setActiveTab('general');
        } else if (newType === 'pc') {
            setHpVisible(true);
            setVisionRange(30);
            setActiveTab('general');
        } else if (newType === 'npc') {
            setHpVisible(true);
            setActiveTab('general');
        }
    };

    const handleLinkCharacter = (charId: string) => {
        setLinkedId(charId);
        if (!charId) return;
        const char = availableCharacters.find((c) => c.id === charId);
        if (char) {
            setName(char.name);
            if (char.tokenSettings) {
                const ts = char.tokenSettings;
                if (ts.imgUrl) setImgUrl(ts.imgUrl);
                if (ts.displayMode) setDisplayMode(ts.displayMode);
                if (ts.textDetails) {
                    setTextVal(ts.textDetails.text);
                    setTextBgColor(ts.textDetails.backgroundColor);
                    setTextColor(ts.textDetails.textColor);
                }
                if (ts.shape) setShape(ts.shape);
                if (ts.scale) setScale(ts.scale);
                if (ts.size) setSize(ts.size);
                if (ts.border) {
                    setBorderColor(ts.border.color);
                    setBorderWidth(ts.border.width);
                    setBorderStyle(ts.border.style || 'solid');
                }
                if (ts.idleAnimation) setIdleAnimation(ts.idleAnimation);
                if (ts.effect) setEffect(ts.effect);
                if (ts.tint) {
                    const { hex, alpha } = rgbaToHexAlpha(ts.tint);
                    setTintColor(hex);
                    setTintAlpha(alpha);
                }
                if (ts.vision) {
                    setVisionRange(ts.vision.range);
                    setDarkvisionRange(ts.vision.darkvision);
                    const { hex, alpha } = rgbaToHexAlpha(ts.vision.color);
                    setVisionHex(hex);
                    setVisionAlpha(alpha);
                }
                if (ts.light) {
                    setLightEnabled(ts.light.enabled);
                    setLightBright(ts.light.brightRadius);
                    setLightDim(ts.light.dimRadius);
                    setLightColor(ts.light.color);
                    setLightIntensity(ts.light.intensity);
                    setLightAnim(ts.light.animation);
                }
                if (ts.imageX !== undefined) setImageX(ts.imageX);
                if (ts.imageY !== undefined) setImageY(ts.imageY);
                if (ts.imageRotation !== undefined) setImageRotation(ts.imageRotation);
            } else {
                if (char.avatarUrl) {
                    setImgUrl(char.avatarUrl);
                    setDisplayMode('image');
                }
                setVisionRange(char.visionRange || 0);
                setDarkvisionRange(char.darkvisionRange || 0);
                setBorderColor('#3b82f6');
            }
            setHpMax(char.hpMax);
            setHpValue(char.hpCurrent);
            setHpVisible(true);
            setSpeed(char.speed || 9);
            setIsVisible(true);
            if (char.ownerId && !controlledBy.includes(char.ownerId))
                setControlledBy([...controlledBy, char.ownerId]);
        }
    };

    const handleApplyObjectPreset = (presetId: string) => {
        const preset = OBJECT_PRESETS.find((p) => p.id === presetId);
        if (preset) {
            setName(preset.label);
            setDisplayMode('text');
            setTextVal(preset.icon);
            setTextBgColor(preset.color);
            setTextColor('#ffffff');
            setShape('circle');
            setLightEnabled(!!preset.light.enabled);
            setLightBright(preset.light.brightRadius || 0);
            setLightDim(preset.light.dimRadius || 0);
            setLightColor(preset.light.color || '#ffffff');
            setLightIntensity(preset.light.intensity || 0.5);
            setLightAnim(preset.light.animation || 'none');
            setVisionRange(0);
            setDarkvisionRange(0);
            setEffect(preset.effect);
            setIdleAnimation(preset.animation);
        }
    };

    const getData = (): TokenData => {
        const linkedChar = availableCharacters.find((c) => c.id === linkedId);
        return {
            type: tokenType,
            linkedId: linkedId || undefined,
            ownerId: linkedChar ? linkedChar.ownerId : tokenData.ownerId,
            controlledBy: controlledBy,
            name,
            imgUrl,
            size,
            speed,
            isVisibleToPlayers: isVisible,
            rotation,
            shape,
            scale,
            border: { color: borderColor, width: borderWidth, style: borderStyle },
            tint: tintAlpha > 0 ? hexAlphaToRgba(tintColor, tintAlpha) : undefined,
            idleAnimation,
            effect,
            imageX,
            imageY,
            imageRotation,
            visionRange,
            darkvisionRange,
            visionColor: hexAlphaToRgba(visionHex, visionAlpha),
            light: {
                enabled: lightEnabled,
                brightRadius: lightBright,
                dimRadius: lightDim,
                color: lightColor,
                intensity: lightIntensity,
                animation: lightAnim,
            },
            displayMode,
            textDetails: { text: textVal, backgroundColor: textBgColor, textColor: textColor },
            bars: {
                bar1: { value: hpValue, max: hpMax, color: '#22c55e', visible: hpVisible },
                bar2: { value: mpValue, max: mpMax, color: '#3b82f6', visible: mpVisible },
            },
            conditions,
            auras,
            effects,
            ignoredAuras,
            disposition,
            stats: monsterStats,
        };
    };

    const getVisibleTabs = () => {
        if (tokenType === 'pc')
            return [
                { id: 'general', label: 'Geral', icon: <Eye className="w-4 h-4" /> },
                { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
                { id: 'stats', label: 'Status', icon: <Activity className="w-4 h-4" /> },
                { id: 'light', label: 'Luz', icon: <Sun className="w-4 h-4" /> },
                { id: 'auras', label: 'Auras', icon: <Shield className="w-4 h-4" /> },
                { id: 'perms', label: 'Permissões', icon: <Lock className="w-4 h-4" /> },
            ];
        if (tokenType === 'npc')
            return [
                { id: 'general', label: 'Geral', icon: <Eye className="w-4 h-4" /> },
                { id: 'sheet', label: 'Ficha', icon: <FileText className="w-4 h-4" /> },
                { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
                { id: 'stats', label: 'Status', icon: <Activity className="w-4 h-4" /> },
                { id: 'light', label: 'Luz', icon: <Sun className="w-4 h-4" /> },
                { id: 'auras', label: 'Auras', icon: <Shield className="w-4 h-4" /> },
                { id: 'perms', label: 'Permissões', icon: <Lock className="w-4 h-4" /> },
            ];
        return [
            { id: 'general', label: 'Geral', icon: <Eye className="w-4 h-4" /> },
            { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
            { id: 'light', label: 'Luz', icon: <Sun className="w-4 h-4" /> },
            { id: 'auras', label: 'Auras', icon: <Shield className="w-4 h-4" /> },
        ];
    };

    // Tabs that don't need the preview panel (to give more space)
    const showPreview = !['sheet', 'stats', 'auras', 'perms'].includes(activeTab);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave(getData(), initialPosition);
            }}
            className="flex flex-col h-[90vh] md:h-[85vh] md:max-h-[750px] md:min-h-[500px]"
        >
            {/* Type Selector */}
            <div className="px-4 md:px-6 pt-4 pb-2 bg-zinc-950/95 shrink-0">
                <TokenTypeSelector tokenType={tokenType} onTypeChange={handleTypeChange} />
            </div>

            {/* Main Content - Responsive */}
            <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden bg-zinc-950">
                {/* Preview Panel - Hidden on data-heavy tabs */}
                {showPreview && (
                    <div className="w-full md:w-5/12 bg-zinc-950 p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col gap-4 overflow-y-auto md:overflow-visible">
                        {/* Preview Area */}
                        <div className="w-full h-32 md:h-56 bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-800 relative group overflow-hidden flex items-center justify-center shrink-0">
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                                    backgroundSize: '50px 50px',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <TokenPreviewPanel
                                displayMode={displayMode}
                                imgUrl={imgUrl}
                                textVal={textVal}
                                textBgColor={textBgColor}
                                textColor={textColor}
                                size={size}
                                shape={shape}
                                scale={scale}
                                rotation={rotation}
                                imageX={imageX}
                                imageY={imageY}
                                imageRotation={imageRotation}
                                borderColor={borderColor}
                                borderWidth={borderWidth}
                                borderStyle={borderStyle}
                                tintColor={tintColor}
                                tintAlpha={tintAlpha}
                                idleAnimation={idleAnimation}
                                effect={effect}
                                lightEnabled={lightEnabled}
                                lightDim={lightDim}
                                lightColor={lightColor}
                                lightIntensity={lightIntensity}
                            />
                            {displayMode === 'image' && (
                                <div
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Button type="button" size="sm" variant="secondary" disabled={isUploading}>
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                                        {isUploading ? 'Enviando...' : 'Upload'}
                                    </Button>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>

                        {/* Contextual Options */}
                        <div className="space-y-4">
                            {tokenType === 'pc' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
                                    <SheetLabel icon={<Lock className="w-3 h-3" />}>Vincular Ficha</SheetLabel>
                                    <SheetSelect
                                        value={linkedId}
                                        onChange={handleLinkCharacter}
                                        options={[
                                            { label: 'Sem Vínculo', value: '' },
                                            ...availableCharacters.map((p) => ({ label: `${p.name} (Nvl ${p.level})`, value: p.id })),
                                        ]}
                                        placeholder="Selecionar Herói..."
                                        variant="box"
                                    />
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
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </div>
                                    {searchResults.length > 0 && searchQuery && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                                            {searchResults.map((m) => (
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
                                    <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-3 gap-2">
                                        {OBJECT_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleApplyObjectPreset(preset.id)}
                                                className="flex flex-col items-center justify-center p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-primary/50 hover:bg-zinc-800 transition-all group"
                                            >
                                                <span className="text-xl md:text-2xl mb-1 group-hover:scale-110 transition-transform">{preset.icon}</span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 truncate w-full text-center">{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Display Mode Toggle */}
                            <div className="pt-4 border-t border-zinc-800">
                                <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setDisplayMode('image')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-all ${displayMode === 'image' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <ImageIcon className="w-4 h-4" /> Imagem
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDisplayMode('text')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded transition-all ${displayMode === 'text' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <Type className="w-4 h-4" /> Sigla
                                    </button>
                                </div>

                                {displayMode === 'image' ? (
                                    <SheetInput
                                        variant="ghost"
                                        className="text-xs bg-zinc-900 border border-zinc-800 rounded-md px-2"
                                        placeholder="URL da Imagem..."
                                        value={imgUrl}
                                        onChange={(e) => setImgUrl(e.target.value)}
                                    />
                                ) : (
                                    <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <SheetLabel>Sigla</SheetLabel>
                                                <input
                                                    maxLength={2}
                                                    value={textVal}
                                                    onChange={(e) => setTextVal(e.target.value.toUpperCase())}
                                                    className="w-full h-9 bg-zinc-950 border border-zinc-700 rounded px-2 text-center font-bold uppercase text-white"
                                                />
                                            </div>
                                            <div>
                                                <SheetLabel>Cor Texto</SheetLabel>
                                                <ColorPicker value={textColor} onChange={setTextColor} className="w-full" />
                                            </div>
                                        </div>
                                        <div>
                                            <SheetLabel>Cor Fundo</SheetLabel>
                                            <ColorPicker value={textBgColor} onChange={setTextBgColor} className="w-full" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs Panel - Full width when preview is hidden */}
                <div className="flex-1 bg-zinc-900 flex flex-col overflow-hidden">
                    <TokenTabNav tabs={getVisibleTabs()} activeTab={activeTab} onChange={setActiveTab} />

                    <div className="p-3 md:p-4 overflow-y-auto custom-scrollbar flex-1">
                        {activeTab === 'general' && (
                            <TokenGeneralTab
                                tokenType={tokenType}
                                name={name}
                                onNameChange={handleNameChange}
                                size={size}
                                onSizeChange={setSize}
                                speed={speed}
                                onSpeedChange={setSpeed}
                                disposition={disposition}
                                onDispositionChange={setDisposition}
                                visionRange={visionRange}
                                onVisionRangeChange={setVisionRange}
                                darkvisionRange={darkvisionRange}
                                onDarkvisionRangeChange={setDarkvisionRange}
                                visionHex={visionHex}
                                onVisionHexChange={setVisionHex}
                                visionAlpha={visionAlpha}
                                onVisionAlphaChange={setVisionAlpha}
                            />
                        )}

                        {activeTab === 'sheet' && <TokenSheetTab stats={monsterStats} onStatsChange={setMonsterStats} />}

                        {activeTab === 'style' && (
                            <TokenStyleTab
                                displayMode={displayMode}
                                shape={shape}
                                onShapeChange={setShape}
                                borderColor={borderColor}
                                onBorderColorChange={setBorderColor}
                                borderWidth={borderWidth}
                                onBorderWidthChange={setBorderWidth}
                                borderStyle={borderStyle}
                                onBorderStyleChange={setBorderStyle}
                                scale={scale}
                                onScaleChange={setScale}
                                imageRotation={imageRotation}
                                onImageRotationChange={setImageRotation}
                                imageX={imageX}
                                onImageXChange={setImageX}
                                imageY={imageY}
                                onImageYChange={setImageY}
                                tintColor={tintColor}
                                onTintColorChange={setTintColor}
                                tintAlpha={tintAlpha}
                                onTintAlphaChange={setTintAlpha}
                                effect={effect}
                                onEffectChange={setEffect}
                                idleAnimation={idleAnimation}
                                onIdleAnimationChange={setIdleAnimation}
                            />
                        )}

                        {activeTab === 'stats' && (
                            <TokenStatsTab
                                hpValue={hpValue}
                                onHpValueChange={setHpValue}
                                hpMax={hpMax}
                                onHpMaxChange={setHpMax}
                                hpVisible={hpVisible}
                                onHpVisibleChange={setHpVisible}
                                mpValue={mpValue}
                                onMpValueChange={setMpValue}
                                mpMax={mpMax}
                                onMpMaxChange={setMpMax}
                                mpVisible={mpVisible}
                                onMpVisibleChange={setMpVisible}
                                conditions={conditions}
                                onConditionsChange={setConditions}
                                effects={effects}
                                onEffectsChange={setEffects}
                                ignoredAuras={ignoredAuras}
                                onIgnoredAurasChange={setIgnoredAuras}
                            />
                        )}

                        {activeTab === 'light' && (
                            <TokenLightTab
                                lightEnabled={lightEnabled}
                                onLightEnabledChange={setLightEnabled}
                                lightBright={lightBright}
                                onLightBrightChange={setLightBright}
                                lightDim={lightDim}
                                onLightDimChange={setLightDim}
                                lightColor={lightColor}
                                onLightColorChange={setLightColor}
                                lightIntensity={lightIntensity}
                                onLightIntensityChange={setLightIntensity}
                                lightAnim={lightAnim}
                                onLightAnimChange={setLightAnim}
                            />
                        )}

                        {activeTab === 'auras' && (
                            <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <AuraSettingsPanel
                                    auras={auras}
                                    onChange={setAuras}
                                    sceneTokens={sceneTokens || []}
                                    parentToken={isNew ? ({ ...t, ...getData() } as Token) : ({ ...token, ...getData() } as Token)}
                                />
                            </div>
                        )}

                        {activeTab === 'perms' && (
                            <TokenPermsTab players={players} controlledBy={controlledBy} onControlledByChange={setControlledBy} />
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <TokenModalFooter
                onCancel={onCancel}
                onSaveTemplate={onSaveTemplate ? () => onSaveTemplate(getData()) : undefined}
                isUploading={isUploading}
            />
        </form>
    );
};
